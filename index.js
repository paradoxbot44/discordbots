const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
ChannelType,
PermissionsBitField,
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
modLog: process.env.MODLOG_CHANNEL,
resultChannel: process.env.RESULT_CHANNEL
};

// ================= SLASH =================
const commands = [
new SlashCommandBuilder()
.setName("panel")
.setDescription("🛡 Guardix Panelini açar")
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
console.log(`🛡 Guardix aktif: ${client.user.tag}`);

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

// ================= PANEL UI =================
if (interaction.isChatInputCommand() && interaction.commandName === "panel") {

const row = new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("guardix_ticket")
.setPlaceholder("🎫 Ticket kategorisi seç")
.addOptions(
{
label: "🛡 Guardix Destek",
value: "support"
},
{
label: "💻 Bot Sorunu",
value: "bot"
},
{
label: "❓ Diğer",
value: "other"
}
)
);

const row2 = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("apply_open")
.setLabel("🧾 Yetkili Başvuru")
.setStyle(ButtonStyle.Success)
);

return interaction.reply({
embeds: [
new EmbedBuilder()
.setColor("DarkBlue")
.setTitle("🛡 Guardix Panel")
.setDescription(`
**Guardix Support System**

🎫 Ticket açmak için kategori seç
🧾 Yetkili başvurusu yapabilirsiniz
`)
.setThumbnail("https://i.imgur.com/placeholder.png") // BURAYA BOT LOGO KOY
],
components: [row, row2]
});
}

// ================= TICKET CREATE =================
if (interaction.isStringSelectMenu() && interaction.customId === "guardix_ticket") {

const type = interaction.values[0];

const channel = await interaction.guild.channels.create({
name: `🎫-guardix-${interaction.user.username}`,
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
.setTitle("🎫 Guardix Ticket Açıldı")
.setDescription(`Kategori: **${type}**`)
.setThumbnail("https://i.imgur.com/placeholder.png") // BOT LOGO
],
components: [row]
});

return interaction.reply({
content: `🎫 Ticket açıldı: ${channel}`,
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
.setTitle("🎫 Guardix Ticket")
.setDescription("Ticketınız kapatıldı.")
]
});
}

await interaction.channel.delete();
}

// ================= APPLY OPEN =================
if (interaction.isButton() && interaction.customId === "apply_open") {

const modal = new ModalBuilder()
.setCustomId("apply_modal")
.setTitle("🧾 Guardix Başvuru");

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

await interaction.showModal(modal);
}

// ================= APPLY SUBMIT =================
if (interaction.isModalSubmit() && interaction.customId === "apply_modal") {

const log = client.channels.cache.get(config.modLog);

const embed = new EmbedBuilder()
.setColor("Orange")
.setTitle("🧾 Yeni Guardix Başvuru")
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
content: "🧾 Başvurunuz gönderildi",
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
result.send(`✅ ${user} - **Başvurunuz ONAYLANDI**`);
}

return interaction.reply({ content: "Onaylandı", ephemeral: true });
}

if (interaction.customId.startsWith("reject_")) {

const id = interaction.customId.split("_")[1];
const user = await client.users.fetch(id).catch(() => null);

const result = client.channels.cache.get(config.resultChannel);

if (user && result) {
result.send(`❌ ${user} - **Başvurunuz REDDEDİLDİ**`);
}

return interaction.reply({ content: "Reddedildi", ephemeral: true });
}
}

});

// ================= LOGIN =================
client.login(config.token);
