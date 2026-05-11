const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} aktif!`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong! 🏓');
  }

  if (commandName === 'kapali') {
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
});

client.login(process.env.TOKEN);
