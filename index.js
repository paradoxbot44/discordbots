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
resultChannel: process.env.RESULT_CHANNEL,
welcomeChannel: process.env.WELCOME_CHANNEL
};

// ================= MEMORY DB =================
const db = {
xp: {},
coins: {},
afk: {},
spam: {},
invites: {}
};

// ================= SAFE SYSTEM =================
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

// ================= SLASH COMMANDS =================
const commands = [

new SlashCommandBuilder().setName("panel").setDescription("📌 Panel"),

new SlashCommandBuilder().setName("ban").setDescription("🔨 Ban").addUserOption(o=>o.setName("user").setRequired(true)),
new SlashCommandBuilder().setName("kick").setDescription("👢 Kick").addUserOption(o=>o.setName("user").setRequired(true)),
new SlashCommandBuilder().setName("clear").setDescription("🧹 Clear").addIntegerOption(o=>o.setName("amount").setRequired(true)),

new SlashCommandBuilder().setName("afk").setDescription("🧠 AFK ON"),
new SlashCommandBuilder().setName("daily").setDescription("💰 Günlük coin")

].map(c=>c.toJSON());

// ================= READY =================
client.once("ready", async () => {
console.log(`🟢 ULTRA BOT ACTIVE: ${client.user.tag}`);

const rest = new REST({ version: "10" }).setToken(config.token);

await rest.put(
Routes.applicationCommands(config.clientId),
{ body: commands }
);

// VOICE
const vc = await client.channels.fetch(config.voiceChannel);
if(vc){
joinVoiceChannel({
channelId: vc.id,
guildId: vc.guild.id,
adapterCreator: vc.guild.voiceAdapterCreator,
selfDeaf:false
});
}
});

// ================= MESSAGE SYSTEM =================
client.on("messageCreate", msg=>{

if(msg.author.bot) return;

// XP
db.xp[msg.author.id]=(db.xp[msg.author.id]||0)+1;

// COIN
db.coins[msg.author.id]=(db.coins[msg.author.id]||0)+1;

// AFK CHECK
if(db.afk[msg.mentions.users.first()?.id]){
msg.reply("Kullanıcı AFK");
}

// ANTI SPAM
db.spam[msg.author.id]=(db.spam[msg.author.id]||0)+1;
setTimeout(()=>db.spam[msg.author.id]--,5000);
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async i=>{

// ===== PANEL =====
if(i.isChatInputCommand() && i.commandName==="panel"){
return i.reply({
embeds:[new EmbedBuilder().setColor("Blue").setTitle("ULTRA PANEL")],
components:[
new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("ticket")
.addOptions(
{label:"Support",value:"support"},
{label:"Bot",value:"bot"},
{label:"Other",value:"other"}
)
),
new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId("apply").setLabel("Apply").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId("feedback").setLabel("Feedback").setStyle(ButtonStyle.Primary)
)
]
});
}

// ===== TICKET =====
if(i.isStringSelectMenu() && i.customId==="ticket"){
const ch=await i.guild.channels.create({
name:`ticket-${i.user.username}`,
type:ChannelType.GuildText,
parent:config.ticketCategory,
permissionOverwrites:[
{id:i.guild.id,deny:[PermissionsBitField.Flags.ViewChannel]},
{id:i.user.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages]},
{id:config.staffRole,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages]}
]
});

ch.ownerId=i.user.id;

const row=new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId("close").setLabel("Close").setStyle(ButtonStyle.Danger)
);

ch.send("🎫 Ticket opened");

return i.reply({content:"OK",ephemeral:true});
}

// ===== CLOSE =====
if(i.isButton() && i.customId==="close"){
const u=await client.users.fetch(i.channel.ownerId).catch(()=>null);
if(u)u.send("Ticket closed");
await i.channel.delete();
}

// ===== APPLY =====
if(i.isButton() && i.customId==="apply"){
const modal=new ModalBuilder().setCustomId("apply").setTitle("Apply");

modal.addComponents(
new ActionRowBuilder().addComponents(
new TextInputBuilder().setCustomId("name").setLabel("Name").setStyle(TextInputStyle.Short)
)
);

return i.showModal(modal);
}

// ===== APPLY SUBMIT =====
if(i.isModalSubmit() && i.customId==="apply"){
const log=client.channels.cache.get(config.modLog);

const embed=new EmbedBuilder()
.setColor("Orange")
.setTitle("New Apply")
.setDescription(i.user.tag);

const row=new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`ok_${i.user.id}`).setLabel("Approve").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`no_${i.user.id}`).setLabel("Reject").setStyle(ButtonStyle.Danger)
);

log.send({embeds:[embed],components:[row]});

return i.reply({content:"Sent",ephemeral:true});
}

// ===== APPROVE =====
if(i.isButton() && i.customId.startsWith("ok_")){
const id=i.customId.split("_")[1];
client.channels.cache.get(config.resultChannel).send(`✅ <@${id}> APPROVED`);
}

// ===== REJECT =====
if(i.isButton() && i.customId.startsWith("no_")){
const id=i.customId.split("_")[1];
client.channels.cache.get(config.resultChannel).send(`❌ <@${id}> REJECTED`);
}

// ===== BAN =====
if(i.isChatInputCommand() && i.commandName==="ban"){
if(!i.member.roles.cache.has(config.staffRole))
return i.reply({content:"No perm",ephemeral:true});

const u=i.options.getUser("user");
i.guild.members.ban(u.id);
i.reply("Banned");
}

// ===== KICK =====
if(i.isChatInputCommand() && i.commandName==="kick"){
const u=i.options.getUser("user");
i.guild.members.kick(u.id);
i.reply("Kicked");
}

// ===== CLEAR =====
if(i.isChatInputCommand() && i.commandName==="clear"){
const amount=i.options.getInteger("amount");
await i.channel.bulkDelete(amount);
i.reply({content:"Cleared",ephemeral:true});
}

// ===== AFK =====
if(i.isChatInputCommand() && i.commandName==="afk"){
db.afk[i.user.id]=true;
i.reply("AFK ON");
}

// ===== DAILY =====
if(i.isChatInputCommand() && i.commandName==="daily"){
db.coins[i.user.id]=(db.coins[i.user.id]||0)+100;
i.reply("+100 coins");
}

});

client.login(config.token);
