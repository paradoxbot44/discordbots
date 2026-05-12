const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const config = require("./config");

const commands = [

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("📌 Ana panel"),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("🎫 Ticket sistemi"),

  new SlashCommandBuilder()
    .setName("apply")
    .setDescription("🛡 Yetkili başvuru"),

  new SlashCommandBuilder()
    .setName("topaktif")
    .setDescription("🏆 Leaderboard"),

  new SlashCommandBuilder()
    .setName("etkinlik")
    .setDescription("🎉 Etkinlik sistemi"),

  new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("📢 Duyuru yap")
    .addStringOption(opt =>
      opt.setName("mesaj")
        .setDescription("Duyuru mesajı")
        .setRequired(true)
    )

].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

(async () => {

  try {

    console.log("Slash komutlar yükleniyor...");

    await rest.put(
      Routes.applicationGuildCommands(
        config.CLIENT_ID,
        config.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash komutlar yüklendi ✔");

  } catch (err) {
    console.error(err);
  }

})();
