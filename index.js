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

// ================= SLASH COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Ticket & Başvuru paneli"),

  new SlashCommandBuilder()
    .setName("aktif")
    .setDescription("En aktif kullanıcı")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

let data = {};

// ================= READY =================
client.once("ready", async () => {
  console.log(`${client.user.tag} aktif`);

  await rest.put(
    Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
    { body: commands }
  );
});

// ================= MESSAGE COUNT =================
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (!data[message.author.id]) data[message.author.id] = 0;
  data[message.author.id]++;
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  // ===== SLASH =====
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "panel") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket")
          .setLabel("🎫 Ticket Aç")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("apply")
          .setLabel("🛡 Başvuru")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: "Panel",
        components: [row]
      });
    }

    if (interaction.commandName === "aktif") {
      let topUser = Object.keys(data).sort((a,b)=>data[b]-data[a])[0];

      return interaction.reply(`En aktif: <@${topUser}>`);
    }
  }

  // ===== BUTTONS =====
  if (interaction.isButton()) {

    // 🎫 TICKET
    if (interaction.customId === "ticket") {

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
        content: "Ticket oluşturuldu",
        components: [row]
      });

      return interaction.reply({ content: "Ticket açıldı!", ephemeral: true });
    }

    // 📌 CLAIM
    if (interaction.customId === "claim") {
      return interaction.reply({
        content: `Ticket sahiplenildi: <@${interaction.user.id}>`
      });
    }

    // ❌ CLOSE
    if (interaction.customId === "close") {

      const log = interaction.guild.channels.cache.find(c => c.name === "ticket-log");

      if (log) {
        log.send(`Ticket kapatıldı: ${interaction.channel.name}`);
      }

      return interaction.channel.delete();
    }

    // 🛡 BAŞVURU
    if (interaction.customId === "apply") {

      const modal = new ModalBuilder()
        .setCustomId("apply_form")
        .setTitle("Yetkili Başvuru");

      const age = new TextInputBuilder()
        .setCustomId("age")
        .setLabel("Yaş")
        .setStyle(TextInputStyle.Short);

      const reason = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Neden yetkili olmak istiyorsun?")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(age),
        new ActionRowBuilder().addComponents(reason)
      );

      return interaction.showModal(modal);
    }

    // ✔ ACCEPT
    if (interaction.customId === "accept") {
      return interaction.reply("Başvuru kabul edildi ✔");
    }

    // ❌ DENY
    if (interaction.customId === "deny") {
      return interaction.reply("Başvuru reddedildi ❌");
    }
  }

  // ===== MODAL =====
  if (interaction.isModalSubmit()) {

    if (interaction.customId === "apply_form") {

      const age = interaction.fields.getTextInputValue("age");
      const reason = interaction.fields.getTextInputValue("reason");

      const channel = await interaction.guild.channels.create({
        name: `basvuru-${interaction.user.username}`,
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
        content: `Başvuru\nYaş: ${age}\nSebep: ${reason}`,
        components: [row]
      });

      return interaction.reply({ content: "Başvurun alındı", ephemeral: true });
    }
  }
});

client.login(config.TOKEN);
