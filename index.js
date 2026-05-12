const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const config = require("./config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= DATA =================
let data = {};

// ================= READY =================
client.once("ready", () => {
  console.log(`${client.user.tag} aktif`);
});

// ================= MESSAGE XP =================
client.on("messageCreate", (msg) => {

  if (msg.author.bot) return;

  if (!data[msg.author.id]) data[msg.author.id] = 0;

  data[msg.author.id]++;
});

// ================= INTERACTION =================
client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {

    // ================= PANEL =================
    if (interaction.commandName === "panel") {

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId("ticket_open")
          .setLabel("🎫 Ticket")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("apply_open")
          .setLabel("🛡 Başvuru")
          .setStyle(ButtonStyle.Success)

      );

      return interaction.reply({
        content: "📌 Ana Panel",
        components: [row]
      });
    }

    // ================= TICKET =================
    if (interaction.commandName === "ticket") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_open")
          .setLabel("🎫 Ticket Aç")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        content: "🎫 Ticket Sistemi",
        components: [row]
      });
    }

    // ================= APPLY =================
    if (interaction.commandName === "apply") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("apply_open")
          .setLabel("🛡 Başvur")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: "🛡 Başvuru Sistemi",
        components: [row]
      });
    }

    // ================= LEADERBOARD =================
    if (interaction.commandName === "topaktif") {

      let top = Object.entries(data)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10)
        .map((u,i)=>`${i+1}. <@${u[0]}> - ${u[1]} mesaj`)
        .join("\n");

      return interaction.reply({
        content: `🏆 Top Aktifler\n\n${top || "Veri yok"}`
      });
    }

    // ================= ETKİNLİK =================
    if (interaction.commandName === "etkinlik") {

      const embed = new EmbedBuilder()
        .setTitle("🎉 Etkinlik Başladı")
        .setDescription("Sunucuda etkinlik başladı!")
        .setColor("Purple");

      return interaction.reply({ embeds: [embed] });
    }

    // ================= DUYURU =================
    if (interaction.commandName === "duyuru") {

      const mesaj = interaction.options.getString("mesaj");

      const embed = new EmbedBuilder()
        .setTitle("📢 DUYURU")
        .setDescription(mesaj)
        .setColor("Red");

      interaction.guild.channels.cache.forEach(c => {
        if (c.isTextBased()) {
          c.send({ embeds: [embed] }).catch(()=>{});
        }
      });

      return interaction.reply({
        content: "Duyuru gönderildi",
        ephemeral: true
      });
    }
  }

  // ================= BUTTON =================

  // 🎫 TICKET OPEN
  if (interaction.customId === "ticket_open") {

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
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
        }
      ]
    });

    const row = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("claim")
        .setLabel("📌 Claim")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("close")
        .setLabel("❌ Close")
        .setStyle(ButtonStyle.Danger)

    );

    channel.send({
      content: "🎫 Ticket oluşturuldu",
      components: [row]
    });

    return interaction.reply({
      content: "Ticket açıldı",
      ephemeral: true
    });
  }

  // CLAIM
  if (interaction.customId === "claim") {
    return interaction.reply({
      content: `📌 Ticket sahiplenildi: <@${interaction.user.id}>`
    });
  }

  // CLOSE
  if (interaction.customId === "close") {
    return interaction.channel.delete();
  }

  // ================= APPLY OPEN =================
  if (interaction.customId === "apply_open") {

    const modal = new ModalBuilder()
      .setCustomId("apply_form")
      .setTitle("🛡 Yetkili Başvuru");

    const age = new TextInputBuilder()
      .setCustomId("age")
      .setLabel("Yaş")
      .setStyle(TextInputStyle.Short);

    const exp = new TextInputBuilder()
      .setCustomId("exp")
      .setLabel("Deneyim")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder().addComponents(age),
      new ActionRowBuilder().addComponents(exp)
    );

    return interaction.showModal(modal);
  }

  // ================= MODAL =================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === "apply_form") {

      const age = interaction.fields.getTextInputValue("age");
      const exp = interaction.fields.getTextInputValue("exp");

      const channel = await interaction.guild.channels.create({
        name: `başvuru-${interaction.user.username}`,
        type: ChannelType.GuildText
      });

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId("accept")
          .setLabel("✔ Kabul")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("deny")
          .setLabel("❌ Red")
          .setStyle(ButtonStyle.Danger)

      );

      channel.send({
        content: `🛡 Başvuru\n\nYaş: ${age}\nDeneyim: ${exp}`,
        components: [row]
      });

      return interaction.reply({
        content: "Başvurun gönderildi",
        ephemeral: true
      });
    }
  }

  // ACCEPT
  if (interaction.customId === "accept") {
    return interaction.reply("✔ Başvuru kabul edildi");
  }

  // DENY
  if (interaction.customId === "deny") {
    return interaction.reply("❌ Başvuru reddedildi");
  }

});

client.login(config.TOKEN);
