require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
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
  console.log(`${client.user.tag} online`);
});

/* =========================
   TICKET PANEL KOMUTU
========================= */
client.on("messageCreate", async (message) => {
  if (message.content === "!ticketpanel") {
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("🎫 Ticket Sistemi")
      .setDescription("Aşağıdan ticket türünü seçin.");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("Ticket seç")
      .addOptions(
        {
          label: "Teknik Destek",
          value: "destek",
          description: "Yardım almak için"
        },
        {
          label: "Satın Alım",
          value: "satin_alim",
          description: "Satın alma desteği"
        }
      );

    message.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  if (message.content === "!basvuru") {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📋 Başvuru Sistemi")
      .setDescription("Başvuru yapmak için butona bas.");

    message.channel.send({ embeds: [embed] });
  }
});

/* =========================
   INTERACTIONS
========================= */
client.on("interactionCreate", async (interaction) => {

  /* ===== TICKET DROPDOWN ===== */
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
          },
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setColor("Yellow")
        .setTitle("🎫 Ticket Açıldı")
        .setDescription(`Tür: **${type}**`);

      channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embed]
      });

      return interaction.reply({
        content: `Ticket açıldı: ${channel}`,
        ephemeral: true
      });
    }
  }

  /* ===== BASVURU BUTTON (fake trigger) ===== */
  if (interaction.isButton()) {
    if (interaction.customId === "basvuru_ac") {

      const modal = new ModalBuilder()
        .setCustomId("basvuru_modal")
        .setTitle("Başvuru Formu");

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

  /* ===== BASVURU SUBMIT ===== */
  if (interaction.isModalSubmit()) {

    if (interaction.customId === "basvuru_modal") {

      const yas = interaction.fields.getTextInputValue("yas");
      const deneyim = interaction.fields.getTextInputValue("deneyim");

      const logChannel = interaction.guild.channels.cache.find(
        c => c.name === "başvurular"
      );

      if (!logChannel) {
        return interaction.reply({
          content: "❌ 'başvurular' kanalı yok!",
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("📋 Yeni Başvuru")
        .addFields(
          { name: "Kullanıcı", value: interaction.user.tag },
          { name: "Yaş", value: yas },
          { name: "Deneyim", value: deneyim }
        );

      logChannel.send({ embeds: [embed] });

      return interaction.reply({
        content: "✅ Başvuru gönderildi.",
        ephemeral: true
      });
    }
  }

});

client.login(process.env.TOKEN);
