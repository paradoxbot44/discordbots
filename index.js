const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`${client.user.tag} aktif!`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    // PING KOMUTU
    if (interaction.commandName === 'ping') {
      await interaction.reply('Pong! 🏓');
    }

    // KAPALI KOMUTU
    if (interaction.commandName === 'kapali') {
      const sebep = interaction.options.getString('sebep') || 'Belirtilmedi';
      const sure = interaction.options.getString('sure') || 'Belirtilmedi';

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🔴 SUNUCU KAPALI')
        .setDescription('Sunucu şu an bakımda veya kapalı.')
        .addFields(
          { name: 'Sebep', value: sebep, inline: true },
          { name: 'Süre', value: sure, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

  } catch (err) {
    console.log('HATA:', err);
  }
});

client.login(process.env.TOKEN);
