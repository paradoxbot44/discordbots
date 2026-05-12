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

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let data = {};

// ================= SLASH COMMANDS =================
const commands = [

  new SlashCommandBuilder().setName("panel").setDescription("📌 Panel"),
  new SlashCommandBuilder().setName("ticket").setDescription("🎫 Ticket sistemi"),
  new SlashCommandBuilder().setName("apply").setDescription("🛡 Başvuru sistemi"),

  new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("📢 Duyuru yap")
    .addStringOption(o =>
      o.setName("mesaj")
        .setDescription("Mesaj")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("cekilis")
    .setDescription("🎉 Çekiliş başlat")
    .addStringOption(o =>
      o.setName("odul")
        .setDescription("Ödül")
        .setRequired(true)
    )

].map(c => c.toJSON());

// ================= REGISTER =================
client.once("ready", async () => {

  console.log(`${client.user.tag} aktif`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Slash yüklendi ✔");
});

// ================= MESSAGE XP =================
client.on("messageCreate", msg => {
  if (msg.author.bot) return;
  if (!data[msg.author.id]) data[msg.author.id] = 0;
  data[msg.author.id]++;
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  // ================= SLASH =================
  if (interaction.isChatInputCommand()) {

    // PANEL
    if (interaction.commandName === "panel") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_open").setLabel("🎫 Ticket").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("apply_open").setLabel("🛡 Başvuru").setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ content: "📌 Guardix Panel", components: [row] });
    }

    // TICKET MENU
    if (interaction.commandName === "ticket") {

      const embed = new EmbedBuilder()
        .setTitle("🎫 Guardix Ticket")
        .setColor("Blue")
        .setThumbnail("https://i.imgur.com/your-logo.png")
        .setDescription("Destek almak için ticket aç.");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_open").setLabel("🎫 Aç").setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    // APPLY MENU
    if (interaction.commandName === "apply") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("apply_open").setLabel("🛡 Başvur").setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ content: "Yetkili başvuru sistemi", components: [row] });
    }

    // DUYURU
    if (interaction.commandName === "duyuru") {

      const msg = interaction.options.getString("mesaj");

      const channel = interaction.guild.channels.cache.find(c => c.name === "duyuru");

      const embed = new EmbedBuilder()
        .setTitle("📢 DUYURU")
        .setDescription(msg)
        .setColor("Red");

      if (channel) {
        channel.send({ content: "@everyone", embeds: [embed] });
      }

      return interaction.reply({ content: "Duyuru gönderildi ✔", ephemeral: true });
    }

    // ÇEKİLİŞ
    if (interaction.commandName === "cekilis") {

      const odul = interaction.options.getString("odul");

      const embed = new EmbedBuilder()
        .setTitle("🎉 ÇEKİLİŞ")
        .setDescription(`Ödül: ${odul}\nKatılmak için 🎉 tıkla`)
        .setColor("Gold");

      return interaction.reply({ embeds: [embed] });
    }
  }

  // ================= TICKET =================
  if (interaction.customId === "ticket_open") {

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket")
      .setDescription("Staff ekibi yakında ilgilenecek")
      .setColor("Blue")
      .setThumbnail("https://i.imgur.com/your-logo.png");

    channel.send({ embeds: [embed] });

    return interaction.reply({ content: "Ticket açıldı ✔", ephemeral: true });
  }

  // ================= APPLY MODAL =================
  if (interaction.customId === "apply_open") {

    const modal = new ModalBuilder()
      .setCustomId("apply_form")
      .setTitle("🛡 Guardix Başvuru");

    const q1 = new TextInputBuilder().setCustomId("age").setLabel("Yaş").setStyle(TextInputStyle.Short);
    const q2 = new TextInputBuilder().setCustomId("exp").setLabel("Deneyim").setStyle(TextInputStyle.Paragraph);
    const q3 = new TextInputBuilder().setCustomId("reason").setLabel("Neden yetkili?").setStyle(TextInputStyle.Paragraph);
    const q4 = new TextInputBuilder().setCustomId("active").setLabel("Günlük aktiflik").setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(q1),
      new ActionRowBuilder().addComponents(q2),
      new ActionRowBuilder().addComponents(q3),
      new ActionRowBuilder().addComponents(q4)
    );

    return interaction.showModal(modal);
  }

  // ================= APPLY RESULT CHANNEL =================
  if (interaction.isModalSubmit()) {

    const channel = interaction.guild.channels.cache.find(c => c.name === "basvuru-onay");

    const age = interaction.fields.getTextInputValue("age");
    const exp = interaction.fields.getTextInputValue("exp");
    const reason = interaction.fields.getTextInputValue("reason");
    const active = interaction.fields.getTextInputValue("active");

    const embed = new EmbedBuilder()
      .setTitle("🛡 Yeni Başvuru")
      .setDescription(`<@${interaction.user.id}>`)
      .addFields(
        { name: "Yaş", value: age },
        { name: "Deneyim", value: exp },
        { name: "Sebep", value: reason },
        { name: "Aktiflik", value: active }
      )
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("accept").setLabel("✔ Kabul").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("deny").setLabel("❌ Red").setStyle(ButtonStyle.Danger)
    );

    if (channel) {
      channel.send({ embeds: [embed], components: [row] });
    }

    return interaction.reply({ content: "Başvurun gönderildi ✔", ephemeral: true });
  }

  // ================= ACCEPT / DENY =================
  if (interaction.customId === "accept") {

    await interaction.reply("✔ Başvuru kabul edildi");

    await interaction.channel.send("🎉 Başvurunuz onaylandı <@" + interaction.message.content + ">");

  }

  if (interaction.customId === "deny") {

    return interaction.reply("❌ Başvuru reddedildi");
  }

});

client.login(TOKEN);
