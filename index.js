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

// ================= CRASH GUARD =================
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

// ================= SLASH COMMANDS (FULL FIXED) =================
const commands = [

new SlashCommandBuilder()
.setName("panel")
.setDescription("📌 Ana paneli açar"),

new SlashCommandBuilder()
.setName("ban")
.setDescription("🔨 Kullanıcıyı banlar")
.addUserOption(option =>
option
.setName("user")
.setDescription("Banlanacak kullanıcı")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("kick")
.setDescription("👢 Kullanıcıyı kickler")
.addUserOption(option =>
option
.setName("user")
.setDescription("Kicklenecek kullanıcı")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("rolver")
.setDescription("🎭 Kullanıcıya rol verir")
.addUserOption(option =>
option
.setName("user")
.setDescription("Kullanıcı")
.setRequired(true)
)
.addRoleOption(option =>
option
.setName("role")
.setDescription("Verilecek rol")
.setRequired(true)
)

].map(cmd => cmd.toJSON());

// ================= READY =================
client.once("ready", async () => {
console.log(`🟢 MEGA CORE v5 ONLINE: ${client.user.tag}`);

const rest = new REST({ version: "10" }).setToken(config.token);

try {
await rest.put(
Routes.applicationCommands(config.clientId),
{ body: commands }
);
console.log("Slash commands yüklendi");
} catch (err) {
console.log("Slash error:", err);
}

// VOICE JOIN SAFE
try {
const vc = await client.channels.fetch(config.voiceChannel);

if (vc) {
joinVoiceChannel({
channelId: vc.id,
guildId: vc.guild.id,
adapterCreator: vc.guild.voiceAdapterCreator,
selfDeaf: false
});
}
} catch (e) {
console.log("Voice error:", e);
}
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {

// ================= PANEL =================
if (interaction.isChatInputCommand() && interaction.commandName === "panel") {

return interaction.reply({
embeds: [
new EmbedBuilder()
.setColor("Blue")
.setTitle("🛡 MEGA CORE v5 PANEL")
.setDescription("Ticket + Apply + Moderation System")
],
components: [
new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("ticket_menu")
.setPlaceholder("🎫 Ticket seç")
.addOptions(
{ label: "Support", value: "support" },
{ label: "Bot Help", value: "bot" },
{ label: "Other", value: "other" }
)
),
new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("apply")
.setLabel("🧾 Apply")
.setStyle(ButtonStyle.Success)
)
]
});
}

// ================= TICKET =================
if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {

const channel = await interaction.guild.channels.create({
name: `ticket-${interaction.user.username}`,
type: ChannelType.GuildText,
parent: config.ticketCategory,
permissionOverwrites: [
{ id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
{ id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
{ id: config.staffRole, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
]
});

channel.ownerId = interaction.user.id;

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("close_ticket")
.setLabel("❌ Close")
.setStyle(ButtonStyle.Danger)
);

channel.send({
embeds: [
new EmbedBuilder()
.setColor("Green")
.setTitle("🎫 Ticket Açıldı")
.setDescription("Destek ekibi yakında ilgilenecek")
],
components: [row]
});

return interaction.reply({ content: "Ticket açıldı", ephemeral: true });
}

// ================= CLOSE TICKET =================
if (interaction.isButton() && interaction.customId === "close_ticket") {

const user = await client.users.fetch(interaction.channel.ownerId).catch(() => null);

if (user) user.send("🎫 Ticket kapatıldı.");

await interaction.channel.delete();
}

// ================= APPLY =================
if (interaction.isButton() && interaction.customId === "apply") {

const modal = new ModalBuilder()
.setCustomId("apply_modal")
.setTitle("🧾 Başvuru Formu");

modal.addComponents(
new ActionRowBuilder().addComponents(
new TextInputBuilder()
.setCustomId("name")
.setLabel("İsim")
.setStyle(TextInputStyle.Short)
.setRequired(true)
),
new ActionRowBuilder().addComponents(
new TextInputBuilder()
.setCustomId("exp")
.setLabel("Deneyim")
.setStyle(TextInputStyle.Paragraph)
.setRequired(true)
)
);

return interaction.showModal(modal);
}

// ================= APPLY SUBMIT =================
if (interaction.isModalSubmit() && interaction.customId === "apply_modal") {

const log = client.channels.cache.get(config.modLog);

if (!log) {
return interaction.reply({ content: "Modlog bulunamadı", ephemeral: true });
}

const embed = new EmbedBuilder()
.setColor("Orange")
.setTitle("🧾 Yeni Başvuru")
.setDescription(`Kullanıcı: ${interaction.user.tag}`);

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel("Onayla").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel("Reddet").setStyle(ButtonStyle.Danger)
);

await log.send({ embeds: [embed], components: [row] });

return interaction.reply({ content: "Başvuru gönderildi", ephemeral: true });
}

// ================= APPROVE =================
if (interaction.isButton() && interaction.customId.startsWith("approve_")) {

const id = interaction.customId.split("_")[1];

const result = client.channels.cache.get(config.resultChannel);

if (result) {
result.send(`✅ <@${id}> Başvurunuz ONAYLANDI`);
}

return interaction.reply({ content: "Onaylandı", ephemeral: true });
}

// ================= REJECT =================
if (interaction.isButton() && interaction.customId.startsWith("reject_")) {

const id = interaction.customId.split("_")[1];

const result = client.channels.cache.get(config.resultChannel);

if (result) {
result.send(`❌ <@${id}> Başvurunuz REDDEDİLDİ`);
}

return interaction.reply({ content: "Reddedildi", ephemeral: true });
}

// ================= BAN =================
if (interaction.isChatInputCommand() && interaction.commandName === "ban") {

if (!interaction.member.roles.cache.has(config.staffRole))
return interaction.reply({ content: "Yetkin yok", ephemeral: true });

const user = interaction.options.getUser("user");

await interaction.guild.members.ban(user.id);

return interaction.reply({ content: "Banlandı", ephemeral: true });
}

// ================= KICK =================
if (interaction.isChatInputCommand() && interaction.commandName === "kick") {

if (!interaction.member.roles.cache.has(config.staffRole))
return interaction.reply({ content: "Yetkin yok", ephemeral: true });

const user = interaction.options.getUser("user");

await interaction.guild.members.kick(user.id);

return interaction.reply({ content: "Kicklendi", ephemeral: true });
}

// ================= ROLVER =================
if (interaction.isChatInputCommand() && interaction.commandName === "rolver") {

if (!interaction.member.roles.cache.has(config.staffRole))
return interaction.reply({ content: "Yetkin yok", ephemeral: true });

const user = interaction.options.getUser("user");
const role = interaction.options.getRole("role");

await interaction.guild.members.cache.get(user.id).roles.add(role);

return interaction.reply({ content: "Rol verildi", ephemeral: true });
}

});

client.login(config.token);
