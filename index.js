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
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const config = require("./config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================== DATA ==================
let data = {};

// ================== SLASH COMMANDS ==================
const commands = [
  { name: "panel", description: "📌 Ana panel" },
  { name: "ticket", description: "🎫 Ticket sistemi" },
  { name: "apply", description: "🛡 Başvuru sistemi" },
  { name: "topaktif", description: "🏆 En aktifler" },
  {
    name: "duyuru",
    description: "📢 Duyuru yap",
    options: [{
      name: "mesaj",
      type: 3,
      description: "Duyuru mesajı",
      required: true
    }]
  }
];

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

// ================== READY ==================
client.once("ready", async () => {
  console.log(`${client.user.tag} aktif`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands }
    );
  } catch (err) {
    console.log("Slash hata:", err);
  }
});

// ================== MESSAGE TRACK ==================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  if (!data[msg.author.id]) data[msg.author.id] = 0;
  data[msg.author.id]++;
});

// ================== INTERACTIONS ==================
client.on("interactionCreate", async (interaction) => {

  // ================= SLASH =================
  if (interaction.isChatInputCommand()) {

    // 📌 PANEL
    if (interaction.commandName === "panel") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("t_open").setLabel("🎫 Ticket").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("a_open").setLabel("🛡 Başvuru").setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ content: "📌 Panel", components: [row] });
    }

    // 🎫 TICKET COMMAND
    if (interaction.commandName === "ticket") {

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Sistemi")
        .setDescription("Açmak için butona bas")
        .setColor("Blue");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("t_open").setLabel("🎫 Aç").setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    // 🛡 APPLY COMMAND
    if (interaction.commandName === "apply") {

      const embed = new EmbedBuilder()
        .setTitle("🛡 Başvuru Sistemi")
        .setDescription("Formu doldur")
        .setColor("Green");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("a_open").setLabel("🛡 Başvur").setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    // 🏆 LEADERBOARD
    if (interaction.commandName === "topaktif") {

      let top = Object.entries(data)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10)
        .map((u,i)=>`${i+1}. <@${u[0]}> - ${u[1]}`)
        .join("\n");

      return interaction.reply("🏆 Top Aktifler:\n" + (top || "Veri yok"));
    }

    // 📢 DUYURU
    if (interaction.commandName === "duyuru") {

      const msg = interaction.options.getString("mesaj");

      const embed = new EmbedBuilder()
        .setTitle("📢 DUYURU")
        .setDescription(msg)
        .setColor("Red");

      interaction.guild.channels.cache.forEach(c => {
        if (c.isTextBased()) c.send({ embeds: [embed] }).catch(()=>{});
      });

      return interaction.reply({ content: "Duyuru gönderildi", ephemeral: true });
    }
  }

  // ================= BUTTON =================

  // 🎫 TICKET OPEN
  if (interaction.customId === "t_open") {

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ["ViewChannel"] },
        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] }
      ]
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("claim").setLabel("📌 Claim").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("close").setLabel("❌ Close").setStyle(ButtonStyle.Danger)
    );

    channel.send({ content: "🎫 Ticket açıldı", components: [row] });

    return interaction.reply({ content: "Ticket açıldı", ephemeral: true });
  }

  // 📌 CLAIM
  if (interaction.customId === "claim") {
    return interaction.reply(`📌 Ticket sahiplenildi: <@${interaction.user.id}>`);
  }

  // ❌ CLOSE
  if (interaction.customId === "close") {
    const log = interaction.guild.channels.cache.find(c => c.name === "ticket-log");
    if (log) log.send(`🎫 Ticket kapandı: ${interaction.channel.name}`);

    return interaction.channel.delete();
  }

  // 🛡 APPLY OPEN
  if (interaction.customId === "a_open") {

    const modal = new ModalBuilder()
      .setCustomId("apply_form")
      .setTitle("🛡 Başvuru");

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
        name: `basvuru-${interaction.user.username}`,
        type: ChannelType.GuildText
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("accept").setLabel("✔ Kabul").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("deny").setLabel("❌ Red").setStyle(ButtonStyle.Danger)
      );

      channel.send({
        content: `🛡 Başvuru\nYaş: ${age}\nDeneyim: ${exp}`,
        components: [row]
      });

      return interaction.reply({ content: "Başvuru alındı", ephemeral: true });
    }
  }

  // ================= APPLY ACTIONS =================
  if (interaction.customId === "accept") {
    return interaction.reply("✔ Kabul edildi");
  }

  if (interaction.customId === "deny") {
    return interaction.reply("❌ Reddedildi");
  }
});

client.login(config.TOKEN);
