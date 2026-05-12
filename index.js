const express = require('express');
const app = express();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// BOT CLIENT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// WEB SERVER (Railway 7/24 için)
app.get('/', (req, res) => {
  res.send('Bot 7/24 Aktif!');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Web sunucusu hazır.');
});

// BOT READY
client.once('ready', () => {
  console.log(`${client.user.tag} aktif!`);
});

// SLASH COMMAND SYSTEM
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
          { name: 'Tahmini Açılış', value: sure, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

  } catch (err) {
    console.log('HATA:', err);
  }
});

// BOT LOGIN
client.login(process.env.TOKEN);
