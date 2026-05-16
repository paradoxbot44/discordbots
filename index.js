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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* =========================
   AKTİFLİK SİSTEMİ
========================= */
const msgCount = new Map();

client.on("messageCreate", (m) => {
  if (m.author.bot) return;
  msgCount.set(m.author.id, (msgCount.get(m.author.id) || 0) + 1);
});

/* =========================
   SLASH COMMANDS
========================= */
const commands = [
  new SlashCommandBuilder().setName("ticket").setDescription("🎫 Ticket panel"),
  new SlashCommandBuilder().setName("basvuru").setDescription("📋 Başvuru panel"),
  new SlashCommandBuilder().setName("aktif").setDescription("📊 En aktif kullanıcı"),
  new SlashCommandBuilder().setName("cekilis").setDescription("🎉 Çekiliş başlat")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("Slash hazır");
})();

/* =========================
   READY
========================= */
client.once("ready", () => {
  console.log(`${client.user.tag} online`);
});

/* =========================
   INTERACTIONS
========================= */
client.on("interactionCreate", async (i) => {

  /* ===== SLASH ===== */
  if (i.isChatInputCommand()) {

    /* TICKET */
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

      return i.reply({
        embeds: [new EmbedBuilder().setTitle("🎫 Ticket Sistemi").setColor("Blue")],
        components: [new ActionRowBuilder().addComponents(menu)]
      });
    }

    /* BASVURU */
    if (i.commandName === "basvuru") {

      const btn = new ButtonBuilder()
        .setCustomId("basvuru_open")
        .setLabel("📋 Başvuru Yap")
        .setStyle(ButtonStyle.Success);

      return i.reply({
        embeds: [new EmbedBuilder().setTitle("📋 Başvuru").setColor("Green")],
        components: [new ActionRowBuilder().addComponents(btn)]
      });
    }

    /* AKTİF */
    if (i.commandName === "aktif") {

      const top = [...msgCount.entries()].sort((a,b)=>b[1]-a[1])[0];
      if (!top) return i.reply("Veri yok");

      const user = await client.users.fetch(top[0]);

      return i.reply({
        embeds: [
          new EmbedBuilder()
          .setTitle("📊 En Aktif")
          .setDescription(`${user.tag}`)
          .addFields({ name: "Mesaj", value: `${top[1]}` })
        ]
      });
    }

    /* ÇEKİLİŞ */
    if (i.commandName === "cekilis") {

      const embed = new EmbedBuilder()
        .setTitle("🎉 ÇEKİLİŞ")
        .setDescription("Katılmak için 🎉 bas")
        .setColor("Gold");

      const msg = await i.reply({ embeds: [embed], fetchReply: true });
      msg.react("🎉");
    }
  }

  /* ===== TICKET ===== */
  if (i.isStringSelectMenu()) {

    if (i.customId === "ticket_menu") {

      const type = i.values[0];

      const channel = await i.guild.channels.create({
        name: `ticket-${i.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("claim").setLabel("👮 Claim").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("inceleniyor").setLabel("⏳ İnceleniyor").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("cozuldu").setLabel("✅ Çözüldü").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("kapat").setLabel("🔒 Kapat").setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `<@${i.user.id}>`,
        embeds: [
          new EmbedBuilder()
          .setTitle("🎫 Ticket Açıldı")
          .setDescription(`Kategori: ${type}`)
          .setColor("Yellow")
        ],
        components: [row]
      });

      return i.reply({ content: `Ticket: ${channel}`, ephemeral: true });
    }
  }

  /* ===== BUTTONS ===== */
  if (i.isButton()) {

    /* BASVURU */
    if (i.customId === "basvuru_open") {

      const modal = new ModalBuilder()
        .setCustomId("basvuru_modal")
        .setTitle("📋 Başvuru");

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

    if (i.customId === "claim") return i.reply("👮 alındı");
    if (i.customId === "inceleniyor") return i.reply("⏳ inceleniyor");
    if (i.customId === "cozuldu") return i.reply("✅ çözüldü");

    if (i.customId === "kapat") {
      await i.reply("kapanıyor");
      setTimeout(() => i.channel.delete(), 3000);
    }
  }

  /* ===== BASVURU MODAL ===== */
  if (i.isModalSubmit()) {

    if (i.customId === "basvuru_modal") {

      const yas = i.fields.getTextInputValue("yas");
      const deneyim = i.fields.getTextInputValue("deneyim");

      const log = i.guild.channels.cache.find(c => c.name === "basvuru-sonuc");

      if (!log)
        return i.reply({ content: "basvuru-sonuc kanalı yok", ephemeral: true });

      log.send({
        embeds: [
          new EmbedBuilder()
          .setTitle("📋 Başvuru")
          .addFields(
            { name: "Kullanıcı", value: i.user.tag },
            { name: "Yaş", value: yas },
            { name: "Deneyim", value: deneyim }
          )
        ]
      });

      return i.reply({ content: "Gönderildi", ephemeral: true });
    }
  }

});

client.login(process.env.TOKEN);
