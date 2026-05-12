const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
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

// ================= ENV =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= DATA =================
let messages = {};

// ================= SLASH COMMANDS =================
const commands = [

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("📌 Ana panel"),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("🎫 Ticket sistemi"),

  new SlashCommandBuilder()
    .setName("apply")
    .setDescription("🛡 Yetkili başvuru"),

  new SlashCommandBuilder()
    .setName("topaktif")
    .setDescription("🏆 Leaderboard"),

  new SlashCommandBuilder()
    .setName("etkinlik")
    .setDescription("🎉 Etkinlik başlat"),

  new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("📢 Duyuru yap")
    .addStringOption(option =>
      option
        .setName("mesaj")
        .setDescription("Duyuru mesajı")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

// ================= READY =================
client.once("ready", async () => {

  console.log(`${client.user.tag} aktif`);

  try {

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash komutlar yüklendi ✔");

  } catch (err) {
    console.log(err);
  }
});

// ================= MESSAGE TRACK =================
client.on("messageCreate", (msg) => {

  if (msg.author.bot) return;

  if (!messages[msg.author.id]) {
    messages[msg.author.id] = 0;
  }

  messages[msg.author.id]++;
});

// ================= INTERACTION =================
client.on("interactionCreate", async (interaction) => {

  // ================= SLASH =================
  if (interaction.isChatInputCommand()) {

    // PANEL
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

    // TICKET
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

    // APPLY
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

    // TOPAKTIF
    if (interaction.commandName === "topaktif") {

      const top = Object.entries(messages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map((user, index) =>
          `${index + 1}. <@${user[0]}> - ${user[1]} mesaj`
        )
        .join("\n");

      return interaction.reply({
        content: `🏆 Top Aktifler\n\n${top || "Veri yok"}`
      });
    }

    // ETKINLIK
    if (interaction.commandName === "etkinlik") {

      const embed = new EmbedBuilder()
        .setTitle("🎉 Etkinlik Başladı")
        .setDescription("Sunucuda etkinlik başladı!")
        .setColor("Purple");

      return interaction.reply({
        embeds: [embed]
      });
    }

    // DUYURU
    if (interaction.commandName === "duyuru") {

      const mesaj = interaction.options.getString("mesaj");

      const embed = new EmbedBuilder()
        .setTitle("📢 DUYURU")
        .setDescription(mesaj)
        .setColor("Red");

      interaction.guild.channels.cache.forEach(channel => {

        if (channel.isTextBased()) {
          channel.send({
            embeds: [embed]
          }).catch(() => {});
        }

      });

      return interaction.reply({
        content: "Duyuru gönderildi ✔",
        ephemeral: true
      });
    }
  }

  // ================= BUTTONS =================

  // OPEN TICKET
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
        .setCustomId("claim_ticket")
        .setLabel("📌 Claim")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("❌ Close")
        .setStyle(ButtonStyle.Danger)

    );

    channel.send({
      content: `🎫 Hoşgeldin <@${interaction.user.id}>`,
      components: [row]
    });

    return interaction.reply({
      content: "Ticket açıldı ✔",
      ephemeral: true
    });
  }

  // CLAIM
  if (interaction.customId === "claim_ticket") {

    return interaction.reply({
      content: `📌 Ticket sahiplenildi: <@${interaction.user.id}>`
    });
  }

  // CLOSE
  if (interaction.customId === "close_ticket") {

    return interaction.channel.delete();
  }

  // APPLY OPEN
  if (interaction.customId === "apply_open") {

    const modal = new ModalBuilder()
      .setCustomId("apply_modal")
      .setTitle("🛡 Yetkili Başvuru");

    const ageInput = new TextInputBuilder()
      .setCustomId("age")
      .setLabel("Yaş")
      .setStyle(TextInputStyle.Short);

    const expInput = new TextInputBuilder()
      .setCustomId("exp")
      .setLabel("Deneyim")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ageInput),
      new ActionRowBuilder().addComponents(expInput)
    );

    return interaction.showModal(modal);
  }

  // ================= MODAL =================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === "apply_modal") {

      const age = interaction.fields.getTextInputValue("age");
      const exp = interaction.fields.getTextInputValue("exp");

      const channel = await interaction.guild.channels.create({
        name: `başvuru-${interaction.user.username}`,
        type: ChannelType.GuildText
      });

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId("apply_accept")
          .setLabel("✔ Kabul")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("apply_deny")
          .setLabel("❌ Red")
          .setStyle(ButtonStyle.Danger)

      );

      const embed = new EmbedBuilder()
        .setTitle("🛡 Yeni Başvuru")
        .addFields(
          { name: "Kullanıcı", value: `<@${interaction.user.id}>` },
          { name: "Yaş", value: age },
          { name: "Deneyim", value: exp }
        )
        .setColor("Blue");

      channel.send({
        embeds: [embed],
        components: [row]
      });

      return interaction.reply({
        content: "Başvurun gönderildi ✔",
        ephemeral: true
      });
    }
  }

  // ACCEPT
  if (interaction.customId === "apply_accept") {

    return interaction.reply({
      content: "✔ Başvuru kabul edildi"
    });
  }

  // DENY
  if (interaction.customId === "apply_deny") {

    return interaction.reply({
      content: "❌ Başvuru reddedildi"
    });
  }

});

client.login(TOKEN);
