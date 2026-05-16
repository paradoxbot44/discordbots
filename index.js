require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder
} = require("discord.js");

const {
  joinVoiceChannel
} = require("@discordjs/voice");

const mongoose = require("mongoose");

const client = new Client({
  intents: Object.values(GatewayIntentBits),
  partials: Object.values(Partials)
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Mongo bağlandı"))
.catch(console.error);

const commands = [

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Bot ping"),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket paneli"),

  new SlashCommandBuilder()
    .setName("basvuru")
    .setDescription("Başvuru paneli"),

].map(c => c.toJSON());

const rest = new REST({ version: "10" })
.setToken(process.env.TOKEN);

(async () => {
  try {

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash commandlar yüklendi");

  } catch(err) {
    console.log(err);
  }
})();

client.once(Events.ClientReady, async () => {

  console.log(`${client.user.tag} aktif`);

  const channel = client.channels.cache.get(process.env.VOICE_CHANNEL);

  if(channel) {

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    });

    console.log("Ses kanalına bağlandı");
  }

});

client.on(Events.InteractionCreate, async interaction => {

  if(interaction.isChatInputCommand()) {

    if(interaction.commandName === "ping") {

      const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🏓 Pong")
      .setDescription(`Ping: ${client.ws.ping}`);

      return interaction.reply({
        embeds: [embed]
      });

    }

    if(interaction.commandName === "ticket") {

      const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
        .setCustomId("ticket_ac")
        .setLabel("🎫 Ticket Aç")
        .setStyle(ButtonStyle.Primary)
      );

      const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Destek Sistemi")
      .setDescription("Ticket açmak için aşağıdaki butona bas.");

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });

    }

    if(interaction.commandName === "basvuru") {

      const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
        .setCustomId("basvuru_yap")
        .setLabel("📋 Başvuru Yap")
        .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: "Başvuru paneli",
        components: [row]
      });

    }

  }

  if(interaction.isButton()) {

    if(interaction.customId === "ticket_ac") {

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages
            ]
          }
        ]
      });

      const row = new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
        .setCustomId("ticket_kapat")
        .setLabel("🔒 Ticket Kapat")
        .setStyle(ButtonStyle.Danger)

      );

      channel.send({
        content: `${interaction.user}`,
        embeds: [
          new EmbedBuilder()
          .setColor("Green")
          .setTitle("Ticket Açıldı")
          .setDescription("Yetkililer yakında ilgilenecek.")
        ],
        components: [row]
      });

      return interaction.reply({
        content: `Ticket oluşturuldu: ${channel}`,
        ephemeral: true
      });

    }

    if(interaction.customId === "ticket_kapat") {

      await interaction.reply({
        content: "Ticket 5 saniye sonra kapanacak"
      });

      setTimeout(() => {
        interaction.channel.delete();
      }, 5000);

    }

    if(interaction.customId === "basvuru_yap") {

      const modal = new ModalBuilder()
      .setCustomId("basvuru_modal")
      .setTitle("Başvuru Formu");

      const yas = new TextInputBuilder()
      .setCustomId("yas")
      .setLabel("Yaşınız")
      .setStyle(TextInputStyle.Short);

      const deneyim = new TextInputBuilder()
      .setCustomId("deneyim")
      .setLabel("Deneyiminiz")
      .setStyle(TextInputStyle.Paragraph);

      const row1 = new ActionRowBuilder().addComponents(yas);
      const row2 = new ActionRowBuilder().addComponents(deneyim);

      modal.addComponents(row1, row2);

      return interaction.showModal(modal);

    }

    if(interaction.customId.startsWith("onay_")) {

      return interaction.reply({
        content:
        "✅ Başvurunuz onaylandı, tebrikler. Sıradaki aşama sesli mülakattır. Lütfen mülakat için yetkilileri bekleyin.",
        ephemeral: true
      });

    }

    if(interaction.customId.startsWith("red_")) {

      return interaction.reply({
        content:
        "❌ Başvurunuz reddedildi. Daha sonra tekrar başvurabilirsiniz.",
        ephemeral: true
      });

    }

  }

  if(interaction.isModalSubmit()) {

    if(interaction.customId === "basvuru_modal") {

      const yas = interaction.fields.getTextInputValue("yas");
      const deneyim = interaction.fields.getTextInputValue("deneyim");

      const kanal = interaction.guild.channels.cache.find(
        c => c.name === "başvurular"
      );

      if(kanal) {

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

        kanal.send({
          embeds: [
            new EmbedBuilder()
            .setColor("Orange")
            .setTitle("Yeni Başvuru")
            .addFields(
              {
                name: "Kullanıcı",
                value: `${interaction.user.tag}`
              },
              {
                name: "Yaş",
                value: yas
              },
              {
                name: "Deneyim",
                value: deneyim
              }
            )
          ],
          components: [row]
        });

      }

      return interaction.reply({
        content: "Başvurunuz gönderildi",
        ephemeral: true
      });

    }

  }

});

client.login(process.env.TOKEN);
