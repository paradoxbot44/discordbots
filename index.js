require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

/* =========================
   SLASH COMMANDS REGISTER
========================= */
const commands = [

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("🎫 Ticket panelini aç"),

  new SlashCommandBuilder()
    .setName("basvuru")
    .setDescription("📋 Başvuru panelini aç"),

  new SlashCommandBuilder()
    .setName("aktif")
    .setDescription("📊 En aktif kullanıcıyı göster")

].map(x => x.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("Slash commands yüklendi");
})();

/* =========================
   MESSAGE TRACK (AKTİFLİK)
========================= */
const userMessageCount = new Map();

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  const id = msg.author.id;
  userMessageCount.set(id, (userMessageCount.get(id) || 0) + 1);
});

/* =========================
   BOT READY
========================= */
client.once("ready", () => {
  console.log(`${client.user.tag} aktif`);
});

/* =========================
   INTERACTIONS
========================= */
client.on("interactionCreate", async (i) => {

  /* ===== SLASH ===== */
  if (i.isChatInputCommand()) {

    /* TICKET PANEL */
    if (i.commandName === "ticket") {

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("🎫 Kategori seç")
        .addOptions(
          { label: "Teknik Destek", value: "tech" },
          { label: "Satın Alım", value: "buy" },
          { label: "Feedback", value: "feed" },
          { label: "Destek", value: "support" }
        );

      const embed = new EmbedBuilder()
        .setTitle("🎫 Gelişmiş Ticket Sistemi")
        .setColor("Blue")
        .setDescription("Kategori seçerek ticket aç");

      return i.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)]
      });
    }

    /* BASVURU PANEL */
    if (i.commandName === "basvuru") {

      const btn = new ButtonBuilder()
        .setCustomId("basvuru_open")
        .setLabel("📋 Başvuru Yap")
        .setStyle(ButtonStyle.Success);

      const embed = new EmbedBuilder()
        .setTitle("📋 Başvuru Sistemi")
        .setColor("Green")
        .setDescription("Başvuru formunu aç");

      return i.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(btn)]
      });
    }

    /* AKTIF USER */
    if (i.commandName === "aktif") {

      let topUser = [...userMessageCount.entries()]
        .sort((a, b) => b[1] - a[1])[0];

      if (!topUser) return i.reply("Henüz veri yok");

      const user = await client.users.fetch(topUser[0]);

      const embed = new EmbedBuilder()
        .setTitle("📊 En Aktif Kullanıcı")
        .setColor("Gold")
        .setDescription(`${user.tag}`)
        .addFields(
          { name: "Mesaj Sayısı", value: `${topUser[1]}` }
        );

      return i.reply({ embeds: [embed] });
    }
  }

  /* ===== TICKET SYSTEM ===== */
  if (i.isStringSelectMenu()) {

    if (i.customId === "ticket_menu") {

      const type = i.values[0];

      const channel = await i.guild.channels.create({
        name: `ticket-${i.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: i.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: i.user.id,
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
        .setDescription(`Kategori: **${type}**
        
Durum: 🟡 İnceleniyor`);

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

      await channel.send({
        content: `<@${i.user.id}>`,
        embeds: [embed],
        components: [row]
      });

      return i.reply({
        content: `Ticket açıldı: ${channel}`,
        ephemeral: true
      });
    }
  }

  /* ===== BUTTONS ===== */
  if (i.isButton()) {

    /* BASVURU MODAL */
    if (i.customId === "basvuru_open") {

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

      return i.showModal(modal);
    }

    /* TICKET YETKİ */
    const admin = i.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!admin) return;

    if (i.customId === "claim") return i.reply("👮 Ticket alındı");
    if (i.customId === "inceleniyor") return i.reply("⏳ İnceleniyor");
    if (i.customId === "cozuldu") return i.reply("✅ Çözüldü");

    if (i.customId === "kapat") {
      await i.reply("🔒 Kapanıyor...");
      setTimeout(() => i.channel.delete(), 4000);
    }
  }

  /* ===== BASVURU ===== */
  if (i.isModalSubmit()) {

    if (i.customId === "basvuru_modal") {

      const yas = i.fields.getTextInputValue("yas");
      const deneyim = i.fields.getTextInputValue("deneyim");

      const log = i.guild.channels.cache.find(c => c.name === "başvurular");

      if (!log)
        return i.reply({ content: "Başvurular kanalı yok", ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle("📋 Yeni Başvuru")
        .setColor("Orange")
        .addFields(
          { name: "Kullanıcı", value: i.user.tag },
          { name: "Yaş", value: yas },
          { name: "Deneyim", value: deneyim }
        );

      log.send({ embeds: [embed] });

      return i.reply({
        content: "📩 Başvuru gönderildi",
        ephemeral: true
      });
    }
  }

});

client.login(process.env.TOKEN);
