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
    .setDescription('Ticket ve başvuru panelini açar')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/* ================= READY ================= */
client.once('ready', async () => {
  console.log(`${client.user.tag} aktif!`);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Slash komut başarıyla yüklendi!');
  } catch (err) {
    console.log('Slash register hata:', err);
  }
});

/* ================= INTERACTIONS ================= */
client.on('interactionCreate', async (interaction) => {
  try {

    /* ===== SLASH ===== */
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === 'panel') {

        const embed = new EmbedBuilder()
          .setTitle('📌 DESTEK PANELİ')
          .setDescription('Aşağıdan seçim yapabilirsiniz.')
          .setColor(0x00AEFF);

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

    /* ===== BUTTON ===== */
    if (interaction.isButton()) {

      /* TICKET */
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

      /* BAŞVURU */
      if (interaction.customId === 'basvuru') {
        return interaction.reply({
          content: '👮 Yetkili başvurusu alındı. Yakında form sistemi eklenecek.',
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
