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

const config = {
token: process.env.TOKEN,
voiceChannel: process.env.VOICE_CHANNEL,
staffRole: process.env.STAFF_ROLE,
ticketCategory: process.env.TICKET_CATEGORY,
logChannel: process.env.LOG_CHANNEL,
clientId: process.env.CLIENT_ID
};

// ================= SLASH COMMANDS =================
const commands = [
new SlashCommandBuilder().setName("ticket").setDescription("Ticket açar"),
new SlashCommandBuilder().setName("basvuru").setDescription("Yetkili başvuru")
].map(c => c.toJSON());

// ================= READY (TEK READY) =================
client.once("ready", async () => {
console.log(`${client.user.tag} aktif`);

// SLASH REGISTER (SADECE 1 KEZ)
try {
const rest = new REST({ version: "10" }).setToken(config.token);

await rest.put(
Routes.applicationCommands(config.clientId),
{ body: commands }
);

console.log("Slash yüklendi");
} catch (err) {
console.log("Slash error:", err);
}

// VOICE (SAFE)
try {
const channel = await client.channels.fetch(config.voiceChannel);

if (channel && channel.joinable) {
joinVoiceChannel({
channelId: channel.id,
guildId: channel.guild.id,
adapterCreator: channel.guild.voiceAdapterCreator,
selfDeaf: false
});

console.log("Voice bağlandı");
}
} catch (err) {
console.log("Voice error:", err);
}
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {

// TICKET
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
.setLabel("Kapat")
.setStyle(ButtonStyle.Danger)
);

channel.send({
embeds: [
new EmbedBuilder()
.setColor("Blue")
.setTitle("Ticket Sistemi")
.setDescription("Yetkililer ilgilenecek")
],
components: [row]
});

return interaction.reply({
content: `Ticket açıldı: ${channel}`,
ephemeral: true
});
}

// BASVURU
if (interaction.isChatInputCommand() && interaction.commandName === "basvuru") {

const log = client.channels.cache.get(config.logChannel);

if (!log) return interaction.reply({
content: "Log yok",
ephemeral: true
});

const embed = new EmbedBuilder()
.setColor("Orange")
.setTitle("Başvuru")
.setDescription(`Kullanıcı: ${interaction.user.tag}`);

log.send({ embeds: [embed] });

return interaction.reply({
content: "Gönderildi",
ephemeral: true
});
}

// BUTTON
if (interaction.isButton()) {
if (interaction.customId === "close_ticket") {
await interaction.channel.delete();
}
}

});

client.login(config.token);
