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

// ================== AKTİFLİK ==================
let data = {};

// ================== SLASH KOMUT ==================
const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Ticket & Başvuru paneli"),

  new SlashCommandBuilder()
    .setName("aktif")
    .setDescription("En aktif kullanıcı")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

client.once("ready", async () => {
  console.log(`${client.user.tag} aktif`);

  await rest.put(
    Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
    { body: commands }
  );
});

// ================== MESAJ SAYMA ==================
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (!data[message.author.id]) data[message.author.id] = 0;
  data[message.author.id]++;
});

// ================== INTERACTION ==================
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

  // ===== BUTTON =====
  if (interaction.isButton()) {

    // TICKET
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
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      return interaction.reply({ content: `Ticket açıldı: ${channel}`, ephemeral: true });
    }

    // BAŞVURU
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

      return interaction.reply({ content: "Başvurun alındı", ephemeral: true });
    }
  }
});

client.login(config.TOKEN);
