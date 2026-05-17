require("dotenv").config();

const {
Client,
GatewayIntentBits,
PermissionsBitField,
ChannelType,
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

const {
joinVoiceChannel
} = require("@discordjs/voice");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildVoiceStates,
GatewayIntentBits.GuildMembers
]
});

let ticketCount = 0;

const economy = new Map();
const levels = new Map();

function addCoin(id, amount) {
if (!economy.has(id)) economy.set(id, 0);
economy.set(id, economy.get(id) + amount);
}

client.once("ready", async () => {

console.log(`${client.user.tag} aktif`);

client.user.setPresence({
activities: [{
name: "/panel",
type: 3
}],
status: "online"
});

const channel = client.channels.cache.get(process.env.VOICE_CHANNEL);

if(channel){
joinVoiceChannel({
channelId: channel.id,
guildId: channel.guild.id,
adapterCreator: channel.guild.voiceAdapterCreator
});
}

await client.application.commands.set([

{
name: "panel",
description: "Ticket paneli"
},

{
name: "coin",
description: "Coin miktarı"
},

{
name: "daily",
description: "Günlük ödül"
},

{
name: "profil",
description: "Profil görüntüle"
},

{
name: "yardim",
description: "Komutlar"
}

], process.env.GUILD_ID);

});

client.on("messageCreate", async message => {

if(message.author.bot) return;

addCoin(message.author.id, 5);

if(!levels.has(message.author.id)){
levels.set(message.author.id, {
xp: 0,
level: 1
});
}

const data = levels.get(message.author.id);

data.xp += 10;

if(data.xp >= data.level * 100){
data.level++;
message.channel.send(`🎉 ${message.author} level atladı!`);
}

});

client.on(Events.InteractionCreate, async interaction => {

if(interaction.isChatInputCommand()){

if(interaction.commandName === "yardim"){

return interaction.reply({
embeds: [
new EmbedBuilder()
.setTitle("Komutlar")
.setDescription(`
🎫 /panel
💰 /coin
🎁 /daily
👤 /profil
`)
.setColor("Blue")
]
});
}

if(interaction.commandName === "coin"){

const coin = economy.get(interaction.user.id) || 0;

return interaction.reply(`💰 Coinin: ${coin}`);
}

if(interaction.commandName === "daily"){

addCoin(interaction.user.id, 500);

return interaction.reply("🎁 500 coin aldın!");
}

if(interaction.commandName === "profil"){

const coin = economy.get(interaction.user.id) || 0;

const level = levels.get(interaction.user.id)?.level || 1;

return interaction.reply({
embeds: [
new EmbedBuilder()
.setTitle(`${interaction.user.username} Profili`)
.addFields(
{
name: "💰 Coin",
value: `${coin}`
},
{
name: "⭐ Level",
value: `${level}`
}
)
.setColor("Gold")
]
});
}

if(interaction.commandName === "panel"){

const menu = new StringSelectMenuBuilder()
.setCustomId("ticket-menu")
.setPlaceholder("Kategori seç")

.addOptions([
{
label: "Teknik Destek",
value: "destek"
},

{
label: "Satın Alım",
value: "satin"
},

{
label: "Feedback",
value: "feedback"
},

{
label: "Partnership",
value: "partner"
},

{
label: "Başvuru",
value: "basvuru"
}
]);

const row = new ActionRowBuilder()
.addComponents(menu);

return interaction.reply({
embeds: [
new EmbedBuilder()
.setTitle("🎫 Destek Paneli")
.setDescription("Aşağıdan kategori seç.")
.setColor("Blue")
],
components: [row]
});
}

}

if(interaction.isStringSelectMenu()){

if(interaction.customId === "ticket-menu"){

if(interaction.values[0] === "basvuru"){

const modal = new ModalBuilder()
.setCustomId("basvuru-modal")
.setTitle("Başvuru Formu");

const soru1 = new TextInputBuilder()
.setCustomId("isim")
.setLabel("İsim")
.setStyle(TextInputStyle.Short);

const soru2 = new TextInputBuilder()
.setCustomId("yas")
.setLabel("Yaş")
.setStyle(TextInputStyle.Short);

const soru3 = new TextInputBuilder()
.setCustomId("aktiflik")
.setLabel("Günlük aktiflik")
.setStyle(TextInputStyle.Short);

const soru4 = new TextInputBuilder()
.setCustomId("neden")
.setLabel("Neden seni seçmeliyiz?")
.setStyle(TextInputStyle.Paragraph);

modal.addComponents(
new ActionRowBuilder().addComponents(soru1),
new ActionRowBuilder().addComponents(soru2),
new ActionRowBuilder().addComponents(soru3),
new ActionRowBuilder().addComponents(soru4)
);

return interaction.showModal(modal);
}

ticketCount++;

const ticketId = ticketCount
.toString()
.padStart(4, "0");

const channel = await interaction.guild.channels.create({

name: `⚪・ticket-${ticketId}`,

type: ChannelType.GuildText,

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
id: process.env.SUPPORT_ROLE,
allow: [
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
}

]

});

const buttons = new ActionRowBuilder()
.addComponents(

new ButtonBuilder()
.setCustomId("claim")
.setLabel("📌 Claim")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("beklemede")
.setLabel("⏳ Beklemede")
.setStyle(ButtonStyle.Secondary),

new ButtonBuilder()
.setCustomId("close")
.setLabel("🔒 Kapat")
.setStyle(ButtonStyle.Danger)

);

await channel.send({

content: `${interaction.user}`,

embeds: [

new EmbedBuilder()
.setTitle(`⚪ Ticket #${ticketId}`)
.setDescription(`
🎫 Ticket oluşturuldu.

⏳ Durum: İnceleniyor
📌 Yetkililer sizinle ilgilenecek.
🔒 Ticketı kapatmak için buton kullanın.
`)
.setColor("Blue")

],

components: [buttons]

});

return interaction.reply({
content: `Ticket oluşturuldu: ${channel}`,
ephemeral: true
});

}

}

if(interaction.isModalSubmit()){

if(interaction.customId === "basvuru-modal"){

const kanal = await interaction.guild.channels.create({

name: `📝・basvuru-${interaction.user.username}`,

type: ChannelType.GuildText,

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
id: process.env.OWNER_ID,
allow: [
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
},

{
id: process.env.SUPPORT_ROLE,
allow: [
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
}

]

});

const row = new ActionRowBuilder()
.addComponents(

new ButtonBuilder()
.setCustomId(`onay_${interaction.user.id}`)
.setLabel("✅ Onayla")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`red_${interaction.user.id}`)
.setLabel("❌ Reddet")
.setStyle(ButtonStyle.Danger)

);

await kanal.send({

embeds: [

new EmbedBuilder()
.setTitle("📝 Yeni Başvuru")
.addFields(

{
name: "İsim",
value: interaction.fields.getTextInputValue("isim")
},

{
name: "Yaş",
value: interaction.fields.getTextInputValue("yas")
},

{
name: "Aktiflik",
value: interaction.fields.getTextInputValue("aktiflik")
},

{
name: "Neden?",
value: interaction.fields.getTextInputValue("neden")
}

)
.setColor("Green")

],

components: [row]

});

return interaction.reply({
content: "📝 Başvurun gönderildi.",
ephemeral: true
});

}

}

if(interaction.isButton()){

if(interaction.customId === "claim"){

return interaction.reply("📌 Ticket claimlendi.");
}

if(interaction.customId === "beklemede"){

return interaction.reply("⏳ Ticket beklemeye alındı.");
}

if(interaction.customId === "close"){

await interaction.reply("🔒 Ticket kapanıyor...");

setTimeout(() => {
interaction.channel.delete();
}, 3000);

}

if(interaction.customId.startsWith("onay_")){

const id = interaction.customId.split("_")[1];

const user = await client.users.fetch(id);

await user.send("🎉 Tebrikler! Başvurunuz onaylandı.");

return interaction.reply("✅ Başvuru onaylandı.");
}

if(interaction.customId.startsWith("red_")){

const id = interaction.customId.split("_")[1];

const user = await client.users.fetch(id);

await user.send("❌ Başvurunuz reddedildi.");

return interaction.reply("❌ Başvuru reddedildi.");
}

}

});

client.login(process.env.TOKEN);
