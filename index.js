require("dotenv").config();

const {
Client,
GatewayIntentBits,
ChannelType,
PermissionsBitField,
ActionRowBuilder,
StringSelectMenuBuilder,
ModalBuilder,
TextInputBuilder,
TextInputStyle,
ButtonBuilder,
ButtonStyle,
EmbedBuilder,
Events
} = require("discord.js");

const { joinVoiceChannel } = require("@discordjs/voice");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildVoiceStates,
GatewayIntentBits.GuildMembers
]
});

// SYSTEMS
let ticketCount = 0;
const coins = new Map();

// ---------------- 7/24 VOICE SAFE ----------------
function connectVoice() {
try {
const channel = client.channels.cache.get(process.env.VOICE_CHANNEL);
if (!channel) return;

joinVoiceChannel({
channelId: channel.id,
guildId: channel.guild.id,
adapterCreator: channel.guild.voiceAdapterCreator,
selfDeaf: false
});

console.log("🎧 Voice connected");
} catch (err) {
console.log("Voice error retrying...");
setTimeout(connectVoice, 5000);
}
}

// ---------------- READY ----------------
client.once("ready", async () => {

console.log(`${client.user.tag} online`);

client.user.setPresence({
activities: [{ name: "Ticket & Support System", type: 3 }],
status: "online"
});

// voice loop (anti disconnect)
connectVoice();
setInterval(connectVoice, 60000);

// SLASH REGISTER
await client.application.commands.set([
{ name: "panel", description: "Ticket panel" },
{ name: "coin", description: "Coin bak" },
{ name: "daily", description: "Günlük coin" }
], process.env.GUILD_ID);

});

// ---------------- MESSAGE COIN FARM ----------------
client.on("messageCreate", (m) => {
if (m.author.bot) return;

coins.set(m.author.id, (coins.get(m.author.id) || 0) + 5);
});

// ---------------- INTERACTION ----------------
client.on(Events.InteractionCreate, async (i) => {

// ---------------- SLASH ----------------
if (i.isChatInputCommand()) {

if (i.commandName === "coin") {
return i.reply(`💰 Coin: ${coins.get(i.user.id) || 0}`);
}

if (i.commandName === "daily") {
coins.set(i.user.id, (coins.get(i.user.id) || 0) + 500);
return i.reply("🎁 +500 coin");
}

if (i.commandName === "panel") {

const menu = new StringSelectMenuBuilder()
.setCustomId("ticket_menu")
.setPlaceholder("Kategori seç")
.addOptions([
{ label: "Destek", value: "support" },
{ label: "Satın Alım", value: "buy" },
{ label: "Feedback", value: "feedback" },
{ label: "Başvuru", value: "apply" }
]);

return i.reply({
embeds: [
new EmbedBuilder()
.setTitle("🎫 Ticket Panel")
.setColor("Blue")
],
components: [new ActionRowBuilder().addComponents(menu)]
});
}
}

// ---------------- DROPDOWN ----------------
if (i.isStringSelectMenu()) {

if (i.values[0] === "apply") {

const modal = new ModalBuilder()
.setCustomId("apply_form")
.setTitle("Başvuru Formu");

const q1 = new TextInputBuilder().setCustomId("name").setLabel("İsim").setStyle(TextInputStyle.Short);
const q2 = new TextInputBuilder().setCustomId("age").setLabel("Yaş").setStyle(TextInputStyle.Short);
const q3 = new TextInputBuilder().setCustomId("reason").setLabel("Neden?").setStyle(TextInputStyle.Paragraph);

modal.addComponents(
new ActionRowBuilder().addComponents(q1),
new ActionRowBuilder().addComponents(q2),
new ActionRowBuilder().addComponents(q3)
);

return i.showModal(modal);
}

// ---------------- TICKET CREATE ----------------
ticketCount++;

const id = String(ticketCount).padStart(4, "0");

const ch = await i.guild.channels.create({
name: `⚪-ticket-${id}`,
type: ChannelType.GuildText,
permissionOverwrites: [
{
id: i.guild.id,
deny: [PermissionsBitField.Flags.ViewChannel]
},
{
id: i.user.id,
allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
},
{
id: process.env.STAFF_ROLE,
allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
}
]
});

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId("claim").setLabel("📌 Claim").setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId("wait").setLabel("⏳ Beklemede").setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId("close").setLabel("🔒 Kapat").setStyle(ButtonStyle.Danger)
);

await ch.send({
content: `${i.user}`,
embeds: [
new EmbedBuilder()
.setTitle(`⚪ Ticket #${id}`)
.setDescription("Durum: İnceleniyor")
.setColor("Blue")
],
components: [row]
});

return i.reply({ content: `Ticket açıldı: ${ch}`, ephemeral: true });
}

// ---------------- MODAL ----------------
if (i.isModalSubmit()) {

const ch = await i.guild.channels.create({
name: `📝-apply-${i.user.username}`,
type: ChannelType.GuildText,
permissionOverwrites: [
{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
{ id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
{ id: process.env.STAFF_ROLE, allow: [PermissionsBitField.Flags.ViewChannel] }
]
});

const embed = new EmbedBuilder()
.setTitle("📝 Başvuru")
.addFields(
{ name: "İsim", value: i.fields.getTextInputValue("name") },
{ name: "Yaş", value: i.fields.getTextInputValue("age") },
{ name: "Sebep", value: i.fields.getTextInputValue("reason") }
)
.setColor("Green");

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`ok_${i.user.id}`).setLabel("Onay").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`no_${i.user.id}`).setLabel("Red").setStyle(ButtonStyle.Danger)
);

await ch.send({ embeds: [embed], components: [row] });

return i.reply({ content: "Başvuru gönderildi", ephemeral: true });
}

// ---------------- BUTTONS ----------------
if (i.isButton()) {

if (i.customId === "claim") {
return i.reply("📌 Claim alındı");
}

if (i.customId === "wait") {
return i.reply("⏳ Beklemede");
}

if (i.customId === "close") {
await i.reply("🔒 Kapanıyor...");
setTimeout(() => i.channel.delete(), 3000);
}

if (i.customId.startsWith("ok_")) {
const id = i.customId.split("_")[1];
client.users.fetch(id).then(u => u.send("✅ Başvurun onaylandı"));
return i.reply("Onaylandı");
}

if (i.customId.startsWith("no_")) {
const id = i.customId.split("_")[1];
client.users.fetch(id).then(u => u.send("❌ Başvurun reddedildi"));
return i.reply("Red");
}
}

});

client.login(process.env.TOKEN);
