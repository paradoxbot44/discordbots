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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ================= SLASH COMMANDS ================= */
const commands = [
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Ticket panelini açar')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/* ================= BOT READY + REGISTER ================= */
client.once('ready', async () => {
  console.log(`${client.user.tag} aktif!`);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Slash komutlar yüklendi!');
  } catch (err) {
    console.log('Slash hata:', err);
  }
});

/* ================= INTERACTIONS ================= */
client.on('interactionCreate', async (interaction) => {
  try {

    /* ===== SLASH COMMAND ===== */
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === 'panel') {

        const embed = new EmbedBuilder()
          .setTitle('📌 DESTEK PANELİ')
          .setDescription('Aşağıdan seçim yap:')
          .setColor(0x2b2d31);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket')
            .setLabel('🎟️ Ticket Aç')
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId('basvuru')
            .setLabel('👮 Yetkili Başvuru')
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

      /* ===== TICKET ===== */
      if (interaction.customId === 'ticket') {

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

      /* ===== YETKİLİ BAŞVURU ===== */
      if (interaction.customId === 'basvuru') {
        return interaction.reply({
          content: '👮 Başvuru sistemi aktif. Yakında form sistemi eklenecek.',
          ephemeral: true
        });
      }
    }

  } catch (err) {
    console.log(err);
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
