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

// ================= SLASH COMMANDS =================
const commands = [
  new SlashCommandBuilder().setName("panel").setDescription("📌 Panel"),
  new SlashCommandBuilder().setName("ticket").setDescription("🎫 Ticket"),
  new SlashCommandBuilder().setName("apply").setDescription("🛡 Başvuru"),
  new SlashCommandBuilder().setName("topaktif").setDescription("🏆 Leaderboard"),
  new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("📢 Duyuru yap")
    .addStringOption(opt =>
      opt.setName("mesaj")
        .setDescription("Duyuru mesajı")
        .setRequired(true)
    )
].map(c => c.toJSON());

// ================= REGISTER =================
const rest = new REST({ version: "10" }).setToken(config.TOKEN);

async function register() {
  try {
    console.log("Slash register başlıyor...");

    await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands }
    );

    console.log("Slash register OK ✔");
  } catch (err) {
    console.log("Register hata:", err);
  }
}

// ================= READY =================
client.once("ready", async () => {
  console.log(`${client.user.tag} aktif`);
  await register();
});

// ================= MESSAGE TRACK =================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  if (!data[msg.author.id]) data[msg.author.id] = 0;
  data[msg.author.id]++;
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  // ========== SLASH ==========
  if (interaction.isChatInputCommand()) {

    // 📌 PANEL
    if (interaction.commandName === "panel") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_open").setLabel("🎫 Ticket").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("apply_open").setLabel("🛡 Başvuru").setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ content: "📌 Panel", components: [row] });
    }

    // 🎫 TICKET
    if (interaction.commandName === "ticket") {

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Sistemi")
        .setColor("Blue");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_open").setLabel("Aç").setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    // 🛡 APPLY
    if (interaction.commandName === "apply") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("apply_open").setLabel("Başvur").setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ content: "🛡 Başvuru Panel", components: [row] });
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

  // ========== BUTTON ==========
  if (interaction.customId === "ticket_open") {

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

  if (interaction.customId === "claim") {
    return interaction.reply(`📌 Ticket sahiplenildi <@${interaction.user.id}>`);
  }

  if (interaction.customId === "close") {

    const log = interaction.guild.channels.cache.find(c => c.name === "ticket-log");
    if (log) log.send(`🎫 Ticket kapandı: ${interaction.channel.name}`);

    return interaction.channel.delete();
  }

  if (interaction.customId === "apply_open") {

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

  // ========== MODAL ==========
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

  if (interaction.customId === "accept") {
    return interaction.reply("✔ Kabul edildi");
  }

  if (interaction.customId === "deny") {
    return interaction.reply("❌ Reddedildi");
  }

});

client.login(config.TOKEN);
