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
let data = {};

// ================= SLASH COMMANDS =================
const commands = [

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("📌 Guardix Panel"),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("🎫 Ticket Sistemi"),

  new SlashCommandBuilder()
    .setName("apply")
    .setDescription("🛡 Yetkili Başvuru"),

  new SlashCommandBuilder()
    .setName("topaktif")
    .setDescription("🏆 Aktiflik Sıralama"),

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

// ================= ACTIVITY TRACK =================
client.on("messageCreate", msg => {

  if (msg.author.bot) return;

  if (!data[msg.author.id]) data[msg.author.id] = 0;

  data[msg.author.id]++;
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
        content: "📌 Guardix Panel",
        components: [row]
      });
    }

    // TICKET MENU
    if (interaction.commandName === "ticket") {

      const embed = new EmbedBuilder()
        .setTitle("🎫 Guardix Ticket Sistemi")
        .setDescription("Destek ekibine ulaşmak için ticket aç.")
        .setColor("Blue")
        .setThumbnail("https://i.imgur.com/your-logo.png")
        .setFooter({ text: "Guardix Support System" });

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId("ticket_open")
          .setLabel("🎫 Ticket Aç")
          .setStyle(ButtonStyle.Primary)

      );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    // APPLY PANEL
    if (interaction.commandName === "apply") {

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId("apply_open")
          .setLabel("🛡 Başvur")
          .setStyle(ButtonStyle.Success)

      );

      return interaction.reply({
        content: "🛡 Guardix Yetkili Başvuru",
        components: [row]
      });
    }

    // LEADERBOARD
    if (interaction.commandName === "topaktif") {

      const top = Object.entries(data)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10)
        .map((u,i)=>`${i+1}. <@${u[0]}> - ${u[1]} mesaj`)
        .join("\n");

      return interaction.reply({
        content: `🏆 Aktiflik\n\n${top || "Veri yok"}`
      });
    }

    // DUYURU
    if (interaction.commandName === "duyuru") {

      const msg = interaction.options.getString("mesaj");

      const embed = new EmbedBuilder()
        .setTitle("📢 DUYURU")
        .setDescription(msg)
        .setColor("Red");

      interaction.guild.channels.cache.forEach(c => {
        if (c.isTextBased()) c.send({ embeds: [embed] }).catch(()=>{});
      });

      return interaction.reply({ content: "Duyuru gönderildi ✔", ephemeral: true });
    }
  }

  // ================= BUTTONS =================

  // TICKET OPEN
  if (interaction.customId === "ticket_open") {

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
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

    const embed = new EmbedBuilder()
      .setTitle("🎫 Guardix Ticket")
      .setColor("Blue")
      .setThumbnail("https://i.imgur.com/your-logo.png")
      .setDescription("Destek ekibi yakında ilgilenecek.");

    channel.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({ content: "Ticket açıldı ✔", ephemeral: true });
  }

  // APPLY OPEN (MODAL)
  if (interaction.customId === "apply_open") {

    const modal = new ModalBuilder()
      .setCustomId("apply_form")
      .setTitle("🛡 Guardix Başvuru");

    const q1 = new TextInputBuilder()
      .setCustomId("age")
      .setLabel("Yaş")
      .setStyle(TextInputStyle.Short);

    const q2 = new TextInputBuilder()
      .setCustomId("exp")
      .setLabel("Deneyim")
      .setStyle(TextInputStyle.Paragraph);

    const q3 = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Neden yetkili olmak istiyorsun?")
      .setStyle(TextInputStyle.Paragraph);

    const q4 = new TextInputBuilder()
      .setCustomId("active")
      .setLabel("Günlük aktiflik süren?")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(q1),
      new ActionRowBuilder().addComponents(q2),
      new ActionRowBuilder().addComponents(q3),
      new ActionRowBuilder().addComponents(q4)
    );

    return interaction.showModal(modal);
  }

  // ================= MODAL =================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === "apply_form") {

      const age = interaction.fields.getTextInputValue("age");
      const exp = interaction.fields.getTextInputValue("exp");
      const reason = interaction.fields.getTextInputValue("reason");
      const active = interaction.fields.getTextInputValue("active");

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

      const embed = new EmbedBuilder()
        .setTitle("🛡 Guardix Başvuru")
        .setColor("Blue")
        .setThumbnail("https://i.imgur.com/your-logo.png")
        .addFields(
          { name: "Kullanıcı", value: `<@${interaction.user.id}>` },
          { name: "Yaş", value: age },
          { name: "Deneyim", value: exp },
          { name: "Sebep", value: reason },
          { name: "Aktiflik", value: active }
        );

      channel.send({
        embeds: [embed],
        components: [row]
      });

      return interaction.reply({
        content: "Başvurun alındı ✔",
        ephemeral: true
      });
    }
  }

  // ACCEPT / DENY
  if (interaction.customId === "accept") {
    return interaction.reply("✔ Kabul edildi");
  }

  if (interaction.customId === "deny") {
    return interaction.reply("❌ Reddedildi");
  }

  if (interaction.customId === "claim") {
    return interaction.reply(`📌 Claim: <@${interaction.user.id}>`);
  }

  if (interaction.customId === "close") {
    return interaction.channel.delete();
  }

});

client.login(TOKEN);
