const { REST, Routes, SlashCommandBuilder } = require('discord.js');

/* ===== KOMUTLAR ===== */
const commands = [
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Ticket panelini açar')
    .toJSON()
];

/* ===== DISCORD BAĞLANTI ===== */
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/* ===== KOMUT YÜKLEME ===== */
(async () => {
  try {
    console.log('Slash komutlar yükleniyor...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Komutlar başarıyla yüklendi!');
  } catch (error) {
    console.error('HATA:', error);
  }
})();
