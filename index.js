const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ================= BOT READY ================= */
client.once('ready', () => {
  console.log(`${client.user.tag} aktif!`);
});

/* ================= INTERACTIONS ================= */
client.on('interactionCreate', async (interaction) => {
  try {

    /* ================= PANEL KOMUTU ================= */
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === 'panel') {

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_open')
            .setLabel('🎟️ Ticket Aç')
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId('apply_open')
            .setLabel('👮 Yetkili Başvuru')
            .setStyle(ButtonStyle.Primary)
        );

        const embed = new EmbedBuilder()
          .setTitle('📌 DESTEK PANELİ')
          .setDescription('Aşağıdan işlem seçebilirsin.')
          .setColor(0x2b2d31);

        return interaction.reply({
          embeds: [embed],
          components: [row]
        });
      }
    }

    /* ================= BUTTONS ================= */
    if (interaction.isButton()) {

      /* ===== TICKET ===== */
      if (interaction.customId === 'ticket_open') {

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

        await channel.send(`🎟️ ${interaction.user} Ticket açtı. Yetkililer gelecek.`);

        return interaction.reply({
          content: `Ticket açıldı: ${channel}`,
          ephemeral: true
        });
      }

      /* ===== YETKİLİ BAŞVURU FORMU ===== */
      if (interaction.customId === 'apply_open') {

        const modal = new ModalBuilder()
          .setCustomId('apply_form')
          .setTitle('👮 Yetkili Başvuru');

        const age = new TextInputBuilder()
          .setCustomId('age')
          .setLabel('Yaşın?')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const reason = new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Neden yetkili olmak istiyorsun?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(age);
        const row2 = new ActionRowBuilder().addComponents(reason);

        modal.addComponents(row1, row2);

        return interaction.showModal(modal);
      }
    }

    /* ================= FORM SUBMIT ================= */
    if (interaction.isModalSubmit()) {

      if (interaction.customId === 'apply_form') {

        const age = interaction.fields.getTextInputValue('age');
        const reason = interaction.fields.getTextInputValue('reason');

        const logChannel = interaction.guild.channels.cache.find(c => c.name === 'log');

        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle('👮 YENİ BAŞVURU')
            .addFields(
              { name: 'Kullanıcı', value: `${interaction.user}` },
              { name: 'Yaş', value: age },
              { name: 'Sebep', value: reason }
            )
            .setColor(0x00ff99);

          logChannel.send({ embeds: [embed] });
        }

        return interaction.reply({
          content: 'Başvurun alındı! Yetkililer inceleyecek.',
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
