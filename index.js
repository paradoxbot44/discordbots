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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

/* ================= CLIENT ================= */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ================= COMMANDS ================= */
const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎟️ Ticket panelini açar'),

  new SlashCommandBuilder()
    .setName('basvuru')
    .setDescription('👮 Yetkili başvuru formunu açar')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/* ================= READY + SLASH REGISTER ================= */
client.once('ready', async () => {
  console.log("================================");
  console.log("BOT ONLINE:", client.user.tag);
  console.log("CLIENT_ID:", process.env.CLIENT_ID);
  console.log("GUILD_ID:", process.env.GUILD_ID);
  console.log("================================");

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("SLASH COMMANDS REGISTERED ✔");
  } catch (err) {
    console.log("SLASH REGISTER ERROR ❌", err);
  }
});

/* ================= INTERACTIONS ================= */
client.on('interactionCreate', async (interaction) => {

  try {

    /* ===== SLASH ===== */
    if (interaction.isChatInputCommand()) {

      /* ===== TICKET ===== */
      if (interaction.commandName === 'ticket') {

        const embed = new EmbedBuilder()
          .setTitle("🎟️ TICKET SİSTEMİ")
          .setDescription("Ticket açmak için butona bas.")
          .setColor(0x00AEFF);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_ac")
            .setLabel("🎟️ Ticket Aç")
            .setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
          embeds: [embed],
          components: [row]
        });
      }

      /* ===== BAŞVURU ===== */
      if (interaction.commandName === 'basvuru') {

        const modal = new ModalBuilder()
          .setCustomId("basvuru_form")
          .setTitle("👮 Yetkili Başvuru");

        const isim = new TextInputBuilder()
          .setCustomId("isim")
          .setLabel("İsim")
          .setStyle(TextInputStyle.Short);

        const yas = new TextInputBuilder()
          .setCustomId("yas")
          .setLabel("Yaş")
          .setStyle(TextInputStyle.Short);

        const deneyim = new TextInputBuilder()
          .setCustomId("deneyim")
          .setLabel("Deneyim")
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
          new ActionRowBuilder().addComponents(isim),
          new ActionRowBuilder().addComponents(yas),
          new ActionRowBuilder().addComponents(deneyim)
        );

        return interaction.showModal(modal);
      }
    }

    /* ===== BUTTON ===== */
    if (interaction.isButton()) {

      if (interaction.customId === "ticket_ac") {

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
    }

    /* ===== MODAL SUBMIT ===== */
    if (interaction.isModalSubmit()) {

      if (interaction.customId === "basvuru_form") {

        const isim = interaction.fields.getTextInputValue("isim");
        const yas = interaction.fields.getTextInputValue("yas");
        const deneyim = interaction.fields.getTextInputValue("deneyim");

        return interaction.reply({
          content:
`👮 BAŞVURU ALINDI

İsim: ${isim}
Yaş: ${yas}
Deneyim: ${deneyim}`,
          ephemeral: true
        });
      }
    }

  } catch (err) {
    console.log("ERROR ❌", err);
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
