const {
Client,
GatewayIntentBits,
PermissionsBitField,
EmbedBuilder,
ChannelType,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
REST,
Routes,
SlashCommandBuilder
} = require("discord.js");

const {
joinVoiceChannel
} = require("@discordjs/voice");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.GuildVoiceStates,
GatewayIntentBits.MessageContent
]
});

// CONFIG (Railway ENV)
const config = {
token: process.env.TOKEN,
voiceChannel: process.env.VOICE_CHANNEL,
staffRole: process.env.STAFF_ROLE,
ticketCategory: process.env.TICKET_CATEGORY,
logChannel: process.env.LOG_CHANNEL,
clientId: process.env.CLIENT_ID
};

// ================= READY =================
client.once("ready", async () => {
console.log(`${client.user.tag} aktif`);

try {
const channel = await client.channels.fetch(config.voiceChannel);

if (channel) {
const connection = joinVoiceChannel({
channelId: channel.id,
guildId: channel.guild.id,
adapterCreator: channel.guild.voiceAdapterCreator,
selfDeaf: false
});

console.log("🎧 Ses kanalına bağlandı (24/7)");
}
} catch (err) {
console.log("Voice error:", err);
}
});

// ================= SLASH COMMAND REGISTER =================
const commands = [
new SlashCommandBuilder()
.setName("ticket")
.setDescription("Ticket açar"),

new SlashCommandBuilder()
.setName("basvuru")
.setDescription("Yetkili başvuru gönderir")
];

client.on("ready", async () => {
const rest = new REST({ version: "10" }).setToken(config.token);

try {
await rest.put(
Routes.applicationCommands(config.clientId),
{ body: commands.map(c => c.toJSON()) }
);

console.log("Slash komutları yüklendi");
} catch (err) {
console.log(err);
}
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {

// ===== TICKET =====
if (interaction.isChatInputCommand() && interaction.commandName === "ticket") {

const channel = await interaction.guild.channels.create({
name: `ticket-${interaction.user.username}`,
type: ChannelType.GuildText,
parent: config.ticketCategory,
permissionOverwrites: [
{
id: interaction.guild.id,
deny: [PermissionsBitField.Flags.ViewChannel]
},
{
id: interaction.user.id,
allow: [
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
},
{
id: config.staffRole,
allow: [
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
}
]
});

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("close_ticket")
.setLabel("Ticket Kapat")
.setStyle(ButtonStyle.Danger)
);

channel.send({
embeds: [
new EmbedBuilder()
.setColor("Blue")
.setTitle("Ticket Sistemi")
.setDescription("Yetkililer en kısa sürede ilgilenecek.")
],
components: [row]
});

return interaction.reply({
content: `Ticket açıldı: ${channel}`,
ephemeral: true
});
}

// ===== BAŞVURU =====
if (interaction.isChatInputCommand() && interaction.commandName === "basvuru") {

const log = client.channels.cache.get(config.logChannel);

if (!log) return interaction.reply({
content: "Log kanalı yok",
ephemeral: true
});

const embed = new EmbedBuilder()
.setColor("Orange")
.setTitle("Yeni Yetkili Başvurusu")
.setDescription(`
Kullanıcı: ${interaction.user.tag}

İsim:
Yaş:
Aktiflik:
Deneyim:
`);

log.send({ embeds: [embed] });

return interaction.reply({
content: "Başvurun alındı.",
ephemeral: true
});
}

// ===== BUTTON =====
if (interaction.isButton()) {

if (interaction.customId === "close_ticket") {
await interaction.channel.delete();
}
}

});

// ================= LOGIN =================
client.login(config.token);
