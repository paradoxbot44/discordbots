const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

new SlashCommandBuilder()
.setName("register")
.setDescription("Kayıt yapar")
.addUserOption(option =>
option.setName("user")
.setDescription("Kullanıcı")
.setRequired(true))

.addIntegerOption(option =>
option.setName("yas")
.setDescription("Yaş")
.setRequired(true)),

new SlashCommandBuilder()
.setName("ticket")
.setDescription("Ticket açar"),

new SlashCommandBuilder()
.setName("basvuru")
.setDescription("Yetkili başvurusu")

].map(x => x.toJSON());

const rest = new REST({ version:"10" })
.setToken("TOKEN");

(async () => {

await rest.put(
Routes.applicationCommands("CLIENT_ID"),
{ body: commands }
);

console.log("Slashlar yüklendi");

})();
