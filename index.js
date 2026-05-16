require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const client = new Client({
  intents: Object.values(GatewayIntentBits),
  partials: Object.values(Partials)
});

client.once(Events.ClientReady, () => {
  console.log(`${client.user.tag} aktif`);
});

/* =========================
   PANEL KOMUTLARI
========================= */
client.on("messageCreate", async (message) => {

  if (message.content === "!ticket") {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("🎫 Ticket seç")
      .addOptions(
        {
          label: "Teknik Destek",
          value: "destek"
        },
        {
          label: "Satın Alım",
          value: "satin"
        }
      );

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket Sistemi")
      .setColor("Blue")
      .setDescription("Aşağıdan seç");

    message.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  if (message.content === "!basvuru") {

    const btn = new ButtonBuilder()
      .setCustomId("basvuru_ac")
      .setLabel("📋 Başvuru Yap")
      .setStyle(ButtonStyle.Success);

    const embed = new EmbedBuilder()
      .setTitle("📋 Başvuru Sistemi")
      .setColor("Green")
      .setDescription("Başvuru için tıkla");

    message.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(btn)]
    });
  }
});

/* =========================
   INTERACTIONS
========================= */
client.on("interactionCreate", async (interaction) => {

  /* ================= TICKET ================= */
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId === "ticket_menu") {

      const type = interaction.values[0];

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

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Açıldı")
        .setColor("Yellow")
        .setDescription(`Tür: **${type}**`);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("claim")
          .setLabel("👮 Claim")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("inceleniyor")
          .setLabel("⏳ İnceleniyor")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("cozuldu")
          .setLabel("✅ Çözüldü")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("kapat")
          .setLabel("🔒 Kapat")
          .setStyle(ButtonStyle.Danger)
      );

      channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embed],
        components: [row]
      });

      return interaction.reply({
        content: `Ticket açıldı: ${channel}`,
        ephemeral: true
      });
    }
  }

  /* ================= BUTTONS ================= */
  if (interaction.isButton()) {

    const isTicketChannel = interaction.channel.name.startsWith("ticket-");

    /* sadece yetkili kontrolü */
    const isAdmin = interaction.member.permissions.has(
      PermissionFlagsBits.Administrator
    );

    if (!isTicketChannel) return;

    /* CLAIM */
    if (interaction.customId === "claim") {
      if (!isAdmin)
        return interaction.reply({ content: "❌ Yetkin yok", ephemeral: true });

      return interaction.reply("👮 Ticket claimlendi");
    }

    /* İNCELENİYOR */
    if (interaction.customId === "inceleniyor") {
      if (!isAdmin)
        return interaction.reply({ content: "❌ Yetkin yok", ephemeral: true });

      return interaction.reply("⏳ Ticket inceleniyor");
    }

    /* ÇÖZÜLDÜ */
    if (interaction.customId === "cozuldu") {
      if (!isAdmin)
        return interaction.reply({ content: "❌ Yetkin yok", ephemeral: true });

      return interaction.reply("✅ Ticket çözüldü");
    }

    /* KAPAT */
    if (interaction.customId === "kapat") {
      if (!isAdmin)
        return interaction.reply({ content: "❌ Yetkin yok", ephemeral: true });

      await interaction.reply("🔒 Ticket 5 saniye içinde kapanıyor");
      setTimeout(() => interaction.channel.delete(), 5000);
    }

    /* BAŞVURU */
    if (interaction.customId === "basvuru_ac") {

      const modal = new ModalBuilder()
        .setCustomId("basvuru_modal")
        .setTitle("📋 Başvuru Formu");

      const yas = new TextInputBuilder()
        .setCustomId("yas")
        .setLabel("Yaş")
        .setStyle(TextInputStyle.Short);

      const deneyim = new TextInputBuilder()
        .setCustomId("deneyim")
        .setLabel("Deneyim")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(yas),
        new ActionRowBuilder().addComponents(deneyim)
      );

      return interaction.showModal(modal);
    }
  }

  /* ================= BASVURU ================= */
  if (interaction.isModalSubmit()) {

    if (interaction.customId === "basvuru_modal") {

      const yas = interaction.fields.getTextInputValue("yas");
      const deneyim = interaction.fields.getTextInputValue("deneyim");

      const log = interaction.guild.channels.cache.find(
        c => c.name === "başvurular"
      );

      if (!log)
        return interaction.reply({
          content: "❌ başvurular kanalı yok",
          ephemeral: true
        });

      const embed = new EmbedBuilder()
        .setTitle("📋 Yeni Başvuru")
        .setColor("Orange")
        .addFields(
          { name: "Kullanıcı", value: interaction.user.tag },
          { name: "Yaş", value: yas },
          { name: "Deneyim", value: deneyim }
        );

      log.send({ embeds: [embed] });

      return interaction.reply({
        content: "✅ Başvuru gönderildi",
        ephemeral: true
      });
    }
  }

});

client.login(process.env.TOKEN);
