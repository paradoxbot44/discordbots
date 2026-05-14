const {
Client,
GatewayIntentBits,
PermissionsBitField,
EmbedBuilder,
ChannelType,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
StringSelectMenuBuilder,
ModalBuilder,
TextInputBuilder,
TextInputStyle,
REST,
Routes,
SlashCommandBuilder
} = require("discord.js");

const { joinVoiceChannel } = require("@discordjs/voice");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.GuildVoiceStates,
GatewayIntentBits.MessageContent
]
});

// ================= CONFIG =================
const config = {
token: process.env.TOKEN,
clientId: process.env.CLIENT_ID,
voiceChannel: process.env.VOICE_CHANNEL,
staffRole: process.env.STAFF_ROLE,
ticketCategory: process.env.TICKET_CATEGORY,
modLogs: process.env.MODLOG_CHANNEL,
resultChannel: process.env.RESULT_CHANNEL
};

// ================= SLASH =================
const commands = [
new SlashCommandBuilder()
.setName("panel")
.setDescription("📌 KateShi Panelini açar"),

new SlashCommandBuilder()
.setName("ticket")
.setDescription("🎫 Ticket sistemi"),

new SlashCommandBuilder()
.setName("basvuru")
.setDescription("🧾 Yetkili başvuru")
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
console.log(`${client.user.tag} aktif`);

// slash register
const rest = new REST({ version: "10" }).setToken(config.token);

await rest.put(
Routes.applicationCommands(config.clientId),
{ body: commands }
);

// voice
const channel = await client.channels.fetch(config.voiceChannel);

if (channel) {
joinVoiceChannel({
channelId: channel.id,
guildId: channel.guild.id,
adapterCreator: channel.guild.voiceAdapterCreator,
selfDeaf: false
});
}
});

// ================= PANEL =================
client.on("interactionCreate", async interaction => {

// ================= KATESHI PANEL =================
if (interaction.isChatInputCommand() && interaction.commandName === "panel") {

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("open_ticket_panel")
.setLabel("🎫 Ticket Aç")
.setEmoji("🎫")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("open_apply_panel")
.setLabel("🧾 Başvuru Yap")
.setEmoji("🧾")
.setStyle(ButtonStyle.Success)
);

return interaction.reply({
embeds: [
new EmbedBuilder()
.setColor("Blue")
.setTitle("🔥 KateShi Bot Panel")
.setDescription(`
🟦 **DESTEK SİSTEMİ**
🎫 Ticket açmak için butona bas

🧾 **BAŞVURU SİSTEMİ**
Yetkili olmak için başvur
`)
.setFooter({ text: "KateShi Systems" })
],
components: [row]
});
}

// ================= TICKET OPEN =================
if (interaction.isButton() && interaction.customId === "open_ticket_panel") {

const row = new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("ticket_select")
.setPlaceholder("🎫 Kategori seç")
.addOptions(
{
label: "🟦 Discord Bot",
value: "bot"
},
{
label: "🟩 Müşteri Hizmetleri",
value: "support"
},
{
label: "🟥 Diğer",
value: "other"
}
)
);

return interaction.reply({
content: "Kategori seçiniz",
components: [row],
ephemeral: true
});
}

// ================= TICKET CREATE =================
if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") {

const type = interaction.values[0];

const channel = await interaction.guild.channels.create({
name: `🎫-${interaction.user.username}`,
type: ChannelType.GuildText,
parent: config.ticketCategory,
permissionOverwrites: [
{
id: interaction.guild.id,
deny: [PermissionsBitField.Flags.ViewChannel]
},
{
id: interaction.user.id,
allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
},
{
id: config.staffRole,
allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
}
]
});

channel.ownerId = interaction.user.id;

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("close_ticket")
.setLabel("❌ Ticket Kapat")
.setStyle(ButtonStyle.Danger)
);

channel.send({
embeds: [
new EmbedBuilder()
.setColor("Green")
.setTitle("🎫 Ticket Açıldı")
.setDescription(`Kategori: **${type}**`)
],
components: [row]
});

return interaction.reply({
content: `Ticket açıldı: ${channel}`,
ephemeral: true
});
}

// ================= CLOSE + DM =================
if (interaction.isButton() && interaction.customId === "close_ticket") {

const user = await client.users.fetch(interaction.channel.ownerId).catch(() => null);

if (user) {
user.send({
embeds: [
new EmbedBuilder()
.setColor("Red")
.setTitle("🎫 Ticket Kapatıldı")
.setDescription("Ticketınız kapatıldı.")
]
});
}

await interaction.channel.delete();
}

// ================= APPLY MODAL =================
if (interaction.isButton() && interaction.customId === "open_apply_panel") {

const modal = new ModalBuilder()
.setCustomId("apply_modal")
.setTitle("🧾 Yetkili Başvuru");

const name = new TextInputBuilder()
.setCustomId("name")
.setLabel("İsim")
.setStyle(TextInputStyle.Short);

const age = new TextInputBuilder()
.setCustomId("age")
.setLabel("Yaş")
.setStyle(TextInputStyle.Short);

const exp = new TextInputBuilder()
.setCustomId("exp")
.setLabel("Deneyim")
.setStyle(TextInputStyle.Paragraph);

modal.addComponents(
new ActionRowBuilder().addComponents(name),
new ActionRowBuilder().addComponents(age),
new ActionRowBuilder().addComponents(exp)
);

return interaction.showModal(modal);
}

// ================= APPLY SUBMIT =================
if (interaction.isModalSubmit() && interaction.customId === "apply_modal") {

const log = client.channels.cache.get(config.modLogs);

const embed = new EmbedBuilder()
.setColor("Orange")
.setTitle("🧾 Yeni Başvuru")
.setDescription(`
👤 Kullanıcı: ${interaction.user.tag}

📛 İsim: ${interaction.fields.getTextInputValue("name")}
🎂 Yaş: ${interaction.fields.getTextInputValue("age")}
💼 Deneyim: ${interaction.fields.getTextInputValue("exp")}
`);

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(`approve_${interaction.user.id}`)
.setLabel("✅ Onayla")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`reject_${interaction.user.id}`)
.setLabel("❌ Reddet")
.setStyle(ButtonStyle.Danger)
);

log.send({ embeds: [embed], components: [row] });

return interaction.reply({
content: "Başvurun gönderildi",
ephemeral: true
});
}

// ================= APPROVE / REJECT =================
if (interaction.isButton()) {

if (interaction.customId.startsWith("approve_")) {

const id = interaction.customId.split("_")[1];
const user = await client.users.fetch(id).catch(() => null);

const result = client.channels.cache.get(config.resultChannel);

if (user && result) {
result.send(`✅ ${user} - Başvurunuz ONAYLANDI`);
}

return interaction.reply({ content: "Onaylandı", ephemeral: true });
}

if (interaction.customId.startsWith("reject_")) {

const id = interaction.customId.split("_")[1];
const user = await client.users.fetch(id).catch(() => null);

const result = client.channels.cache.get(config.resultChannel);

if (user && result) {
result.send(`❌ ${user} - Başvurunuz REDDEDİLDİ`);
}

return interaction.reply({ content: "Reddedildi", ephemeral: true });
}
}

});

// ================= LOGIN =================
client.login(config.token);
