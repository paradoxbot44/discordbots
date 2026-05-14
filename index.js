// index.js
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const {
  joinVoiceChannel
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const config = {
  token: "TOKEN",
  voiceChannel:"SES_KANAL_ID",
  staffRole:"YETKILI_ROL_ID",
  ticketCategory:"KATEGORI_ID",
  logChannel:"LOG_KANAL_ID"
};

client.once("ready", async () => {
  console.log(`${client.user.tag} aktif`);

  // 7/24 Ses Sistemi
  const channel = await client.channels.fetch(config.voiceChannel);

  joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf:false
  });

  console.log("Ses kanalına bağlandı.");
});

client.on("interactionCreate", async interaction => {

  // REGISTER
  if(interaction.isChatInputCommand()) {

    if(interaction.commandName === "register") {

      if(!interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )) return;

      const user = interaction.options.getUser("user");
      const age = interaction.options.getInteger("yas");

      const member =
      interaction.guild.members.cache.get(user.id);

      await member.setNickname(`• İsim | ${age}`);

      interaction.reply({
        embeds:[
([
          new EmbedBuilder()
          .
setColor("Green")
          .setDescription(`${user} kayıt edildi.`)
        ])
      });
    }

    // TICKET
    if(interaction.commandName === "ticket") {

      const channel =
      await interaction.guild.channels.create({
        name:`ticket-${interaction.user.username}`,
        type:ChannelType.GuildText,
        parent: config.ticketCategory,
        permissionOverwrites:[
([
          {
            id:interaction.guild.id,
            deny:["ViewChannel"]
          },
          {
            id:interaction.user.id,
            allow:["ViewChannel","SendMessages"]
          },
          {
            id:config.staffRole,
            allow:["ViewChannel","SendMessages"]
          }
        ])
      });

      const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Ticket Kapat")
        .setStyle(ButtonStyle.Danger)
      );

      channel.send({
        embeds:[
([
          new EmbedBuilder()
          .
setColor("Blue")
          .setTitle("Ticket Sistemi")
          .setDescription("Yetkililer sizinle ilgilenecek.")
        ]),
        components:[row]
      });

      interaction.reply({
        content:`Ticket açıldı: ${channel}`,
        ephemeral:true
      });
    }

    // BAŞVURU
    if(interaction.commandName === "basvuru") {

      const log =
      client.channels.cache.get(config.logChannel);

      const embed = new EmbedBuilder()
      .
setColor("Orange")
      .setTitle("Yeni Yetkili Başvurusu")
      .setDescription(`
İsim:
Yaş:
Aktiflik:
Deneyim:
      `);

      log.send({embeds:[embed]});

      interaction.reply({
        content:"Başvurun gönderildi.",
        ephemeral:true
      });
    }
  }

  // Ticket kapatma
  if(interaction.isButton()) {

    if(interaction.customId === "close_ticket") {
      interaction.channel.delete();
    }
  }
});

client.on("messageCreate", async message => {

  if(message.author.bot) return;

  const prefix = "!";

  // BAN
  if(message.content.startsWith(prefix+"ban")) {

    if(!message.member.permissions.has(
      PermissionsBitField.Flags.BanMembers
    )) return;

    const member =
    message.mentions.members.first();

    if(!member) return;

    await member.ban();

    message.channel.send(`${member.user.tag} banlandı.`);
  }

  // MUTE
  if(message.content.startsWith(prefix+"mute")) {

    const member =
    message.mentions.members.first();

    if(!member) return;

    await member.timeout(3600000);

    message.channel.send(`${member.user.tag} mute yedi.`);
  }

  // PING
  if(message.content === prefix+"ping") {
    message.reply(`Ping: ${client.ws.ping}`);
  }
});

// Giriş çıkış log
client.on("guildMemberAdd", member => {

  const log =
  client.channels.cache.get(config.logChannel);

  log.send({
    embeds:[
([
      new EmbedBuilder()
      .
setColor("Green")
      .setDescription(`${member.user.tag} giriş yaptı.`)
    ])
  });
});

client.on("guildMemberRemove", member => {

  const log =
  client.channels.cache.get(config.logChannel);

  log.send({
    embeds:[
([
      new EmbedBuilder()
      .
setColor("Red")
      .setDescription(`${member.user.tag} çıktı.`)
    ])
  });
});

client.login(config.token);
