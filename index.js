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
logChannel: process.env.LOG_CHANNEL
};

// ================= SLASH =================
const commands = [
new SlashCommandBuilder()
.setName("panel")
.setDescription("Ana paneli açar")
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
console.log(`${client.user.tag} aktif`);

// slash register
try {
const rest = new REST({ version: "10" }).setToken(config.token);

await rest.put(
Routes.applicationCommands(config.clientId),
{ body: commands }
);

console.log("Slash yüklendi");
} catch (err) {
console.log(err);
}

// voice
try {
const channel = await client.channels.fetch(config.voiceChannel);

if (channel) {
joinVoiceChannel({
channelId: channel.id,
guildId: channel.guild.id,
adapterCreator: channel.guild.voiceAdapterCreator,
selfDeaf: false
});

console.log("Voice aktif");
}
} catch (err) {
console.log(err);
}
});

// ================= WELCOME =================
client.on("guildMemberAdd", member => {

const channel =
member.guild.systemChannel ||
member.guild.channels.cache.find(c => c.type === ChannelType.GuildText);

if (!channel) return;

channel.send({
embeds: [
new EmbedBuilder()
.setColor("Green")
.setTitle("👋 Hoşgeldin!")
.setDescription(`Sunucuya hoşgeldin ${member.user}`)
]
});
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {

// ================= PANEL =================
if (interaction.isChatInputCommand() && interaction.commandName === "panel") {

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("open_ticket")
.setLabel("🎫 Ticket Aç")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("open_apply")
.setLabel("🧾 Başvuru")
.setStyle(ButtonStyle.Success)
);

return interaction.reply({
embeds: [
new EmbedBuilder()
.setColor("Blue")
.setTitle("📌 Panel")
.setDescription("İstediğini seç")
],
components: [row]
});
}

// ================= TICKET OPEN =================
if (interaction.isButton() && interaction.customId === "open_ticket") {

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

// OWNER ID SAKLA
channel.ownerId = interaction.user.id;

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("close_ticket")
.setLabel("❌ Kapat")
.setStyle(ButtonStyle.Danger)
);

channel.send({
embeds: [
new EmbedBuilder()
.setColor("Green")
.setTitle("🎫 Ticket Açıldı")
.setDescription("Yetkililer ilgilenecek")
],
components: [row]
});

return interaction.reply({
content: `Ticket açıldı: ${channel}`,
ephemeral: true
});
}

// ================= APPLY =================
if (interaction.isButton() && interaction.customId === "open_apply") {

const log = client.channels.cache.get(config.logChannel);

if (!log) {
return interaction.reply({
content: "Log kanalı yok",
ephemeral: true
});
}

const embed = new EmbedBuilder()
.setColor("Orange")
.setTitle("🧾 Yetkili Başvurusu")
.setDescription(`
Kullanıcı: ${interaction.user.tag}

İsim:
Yaş:
Aktiflik:
Deneyim:
`);

log.send({ embeds: [embed] });

return interaction.reply({
content: "Başvurun gönderildi",
ephemeral: true
});
}

// ================= CLOSE TICKET + DM =================
if (interaction.isButton() && interaction.customId === "close_ticket") {

const userId = interaction.channel.ownerId;

try {
const user = await client.users.fetch(userId);

await user.send({
embeds: [
new EmbedBuilder()
.setColor("Red")
.setTitle("🎫 Ticket Kapatıldı")
.setDescription("Ticketın kapatıldı, teşekkürler.")
]
});
} catch (err) {
console.log("DM gönderilemedi");
}

await interaction.channel.delete();
}

});

// ================= LOGIN =================
client.login(config.token);
