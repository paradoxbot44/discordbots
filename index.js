const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

const fs = require("fs");
const config = require("./config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// ===================== AKTİFLİK SİSTEMİ =====================

let data = {};
if (fs.existsSync("./messages.json")) {
  data = JSON.parse(fs.readFileSync("./messages.json"));
}

function save() {
  fs.writeFileSync("./messages.json", JSON.stringify(data, null, 2));
}

// ===================== SLASH KOMUTLAR =====================

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

// ===================== MESAJ SAYMA =====================

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (!data[message.author.id]) data[message.author.id] = 0;

  data[message.author.id]++;
  save();
});

// ===================== INTERACTION =====================

client.on("interactionCreate", async (interaction) => {

  // ================= PANEL =================
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "panel") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_open")
          .setLabel("🎫 Ticket Aç")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("apply_open")
          .setLabel("🛡️ Yetkili Başvuru")
          .setStyle(ButtonStyle.Success)
      );

      const embed = new EmbedBuilder()
        .setTitle("Panel")
        .setDescription("Ticket veya başvuru açabilirsiniz")
        .setColor("Blue");

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    // ================= AKTİF =================
    if (interaction.commandName === "aktif") {

      let topUser = null;
      let topCount = 0;

      for (const id in data) {
        if (data[id] > topCount) {
          topCount = data[id];
          topUser = id;
        }
      }

      return interaction.reply({
        content: `🏆 En aktif: <@${topUser}> - ${topCount} mesaj`
      });
    }
  }

  // ================= TICKET =================

  if (interaction.isButton()) {

    if (interaction.customId === "ticket_open") {

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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("❌ Kapat")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: "Ticket açıldı",
        components: [row]
      });

      return interaction.reply({
        content: `Ticket açıldı: ${channel}`,
        ephemeral: true
      });
    }

    // ================= TICKET KAPAT =================
    if (interaction.customId === "ticket_close") {
      await interaction.channel.delete();
    }

    // ================= BAŞVURU =================
    if (interaction.customId === "apply_open") {

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

  // ================= MODAL =================

  if (interaction.isModalSubmit()) {

    if (interaction.customId === "apply_form") {

      const age = interaction.fields.getTextInputValue("age");
      const reason = interaction.fields.getTextInputValue("reason");

      const channel = await interaction.guild.channels.create({
        name: `basvuru-${interaction.user.username}`,
        type: ChannelType.GuildText
      });

      const embed = new EmbedBuilder()
        .setTitle("Yeni Başvuru")
        .addFields(
          { name: "Kullanıcı", value: `${interaction.user}` },
          { name: "Yaş", value: age },
          { name: "Sebep", value: reason }
        );

      await channel.send({ embeds: [embed] });

      return interaction.reply({
        content: "Başvurun alındı",
        ephemeral: true
      });
    }
  }
});

client.login(config.TOKEN);
