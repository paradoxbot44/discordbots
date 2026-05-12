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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ================= COMMANDS ================= */
const commands = [
  new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('🎟️ Ticket sistemini açar'),

  new SlashCommandBuilder()
    .setName('basvuru')
    .setDescription('👮 Yetkili başvuru formunu açar')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/* ================= READY ================= */
client.once('ready', async () => {
  console.log("BOT ONLINE:", client.user.tag);

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("Slash commands loaded ✔");
  } catch (err) {
    console.log("Slash error ❌", err);
  }
});

/* ================= INTERACTIONS ================= */
client.on('interactionCreate', async (interaction) => {

  try {

    /* ===== SLASH COMMANDS ===== */
    if (interaction.isChatInputCommand()) {

      /* ===== TICKET PANEL ===== */
      if (interaction.commandName === 'ticketpanel') {

        const embed = new EmbedBuilder()
          .setTitle("🎟️ TICKET SİSTEMİ")
          .setDescription("Aşağıdan ticket açabilirsiniz.")
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

      /* ===== BAŞVURU FORM ===== */
      if (interaction.commandName === 'basvuru') {

        const modal = new ModalBuilder()
          .setCustomId("basvuru_modal")
          .setTitle("👮 Yetkili Başvuru Formu");

        const isim = new TextInputBuilder()
          .setCustomId("isim")
          .setLabel("İsminiz")
          .setStyle(TextInputStyle.Short);

        const yas = new TextInputBuilder()
          .setCustomId("yas")
          .setLabel("Yaşınız")
          .setStyle(TextInputStyle.Short);

        const deneyim = new TextInputBuilder()
          .setCustomId("deneyim")
          .setLabel("Deneyiminiz")
          .setStyle(TextInputStyle.Paragraph);

        const row1 = new ActionRowBuilder().addComponents(isim);
        const row2 = new ActionRowBuilder().addComponents(yas);
        const row3 = new ActionRowBuilder().addComponents(deneyim);

        modal.addComponents(row1, row2, row3);

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

      if (interaction.customId === "basvuru_modal") {

        const isim = interaction.fields.getTextInputValue("isim");
        const yas = interaction.fields.getTextInputValue("yas");
        const deneyim = interaction.fields.getTextInputValue("deneyim");

        return interaction.reply({
          content:
`👮 BAŞVURU ALINDI!

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
