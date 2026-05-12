const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

/* ================= BOT ================= */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ================= SLASH COMMAND ================= */
const commands = [
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Ticket & Başvuru panelini açar')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/* ================= READY + REGISTER ================= */
client.once('ready', async () => {
  console.log("================================");
  console.log("BOT ONLINE:", client.user.tag);
  console.log("CLIENT_ID:", process.env.CLIENT_ID);
  console.log("GUILD_ID:", process.env.GUILD_ID);
  console.log("================================");

  try {
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("SLASH REGISTER SUCCESS ✔");
    console.log("COMMANDS:", data);
  } catch (err) {
    console.log("SLASH REGISTER ERROR ❌", err);
  }
});

/* ================= INTERACTIONS ================= */
client.on('interactionCreate', async (interaction) => {
  try {

    /* ===== SLASH ===== */
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === 'panel') {

        const embed = new EmbedBuilder()
          .setTitle("📌 DESTEK PANELİ")
          .setDescription("Aşağıdan işlem seçiniz:")
          .setColor(0x00AEFF);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket")
            .setLabel("🎟️ Ticket Aç")
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("basvuru")
            .setLabel("👮 Yetkili Başvuru")
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          embeds: [embed],
          components: [row]
        });
      }
    }

    /* ===== BUTTONS ===== */
    if (interaction.isButton()) {

      /* TICKET */
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

        return interaction.reply({
          content: `🎟️ Ticket açıldı: ${channel}`,
          ephemeral: true
        });
      }

      /* BAŞVURU */
      if (interaction.customId === "basvuru") {

        return interaction.reply({
          content: "👮 Başvuru alındı. (Form sistemi yakında eklenecek)",
          ephemeral: true
        });
      }
    }

  } catch (err) {
    console.log("INTERACTION ERROR ❌", err);
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
