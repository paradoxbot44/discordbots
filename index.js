require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events
} = require("discord.js");

const {
    joinVoiceChannel
} = require("@discordjs/voice");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("ready", async () => {
    console.log(`${client.user.tag} aktif!`);

    // 7/24 ses
    const channel = client.channels.cache.get(process.env.VOICE_CHANNEL);

    if (channel) {
        joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        console.log("Ses kanalına bağlandı.");
    }

    // Slash command register
    await client.application.commands.set([
        {
            name: "panel",
            description: "Ticket paneli oluşturur"
        }
    ], process.env.GUILD_ID);

    console.log("Slash komutları register edildi.");
});

client.on(Events.InteractionCreate, async interaction => {

    // PANEL
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "panel") {

            const menu = new StringSelectMenuBuilder()
                .setCustomId("ticket-menu")
                .setPlaceholder("Bir kategori seçin")
                .addOptions([
                    {
                        label: "Teknik Destek",
                        value: "teknik"
                    },
                    {
                        label: "Satın Alım",
                        value: "satin"
                    },
                    {
                        label: "Feedback",
                        value: "feedback"
                    },
                    {
                        label: "Partnership",
                        value: "partner"
                    },
                    {
                        label: "Başvuru",
                        value: "basvuru"
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            const embed = new EmbedBuilder()
                .setTitle("Destek Paneli")
                .setDescription("Aşağıdan kategori seçerek ticket açabilirsiniz.")
                .setColor("Blue");

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }
    }

    // DROPDOWN
    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === "ticket-menu") {

            // Başvuru modalı
            if (interaction.values[0] === "basvuru") {

                const modal = new ModalBuilder()
                    .setCustomId("basvuru-modal")
                    .setTitle("Başvuru Formu");

                const age = new TextInputBuilder()
                    .setCustomId("yas")
                    .setLabel("Yaşınız")
                    .setStyle(TextInputStyle.Short);

                const exp = new TextInputBuilder()
                    .setCustomId("tecrube")
                    .setLabel("Tecrübeniz")
                    .setStyle(TextInputStyle.Paragraph);

                const row1 = new ActionRowBuilder().addComponents(age);
                const row2 = new ActionRowBuilder().addComponents(exp);

                modal.addComponents(row1, row2);

                return await interaction.showModal(modal);
            }

            // Ticket oluştur
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

            // Yetkili rolü
            const supportRole = "YETKILI_ROL_ID";

            await channel.permissionOverwrites.create(supportRole, {
                ViewChannel: true,
                SendMessages: true
            });

            const closeBtn = new ButtonBuilder()
                .setCustomId("close-ticket")
                .setLabel("Ticket Kapat")
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeBtn);

            await channel.send({
                content: `${interaction.user} hoş geldin.`,
                components: [row]
            });

            await interaction.reply({
                content: `Ticket oluşturuldu: ${channel}`,
                ephemeral: true
            });
        }
    }

    // MODAL
    if (interaction.isModalSubmit()) {

        if (interaction.customId === "basvuru-modal") {

            const yas = interaction.fields.getTextInputValue("yas");
            const tecrube = interaction.fields.getTextInputValue("tecrube");

            const kanal = await interaction.guild.channels.create({
                name: `basvuru-${interaction.user.username}`,
                type: ChannelType.GuildText
            });

            const onay = new ButtonBuilder()
                .setCustomId(`onay_${interaction.user.id}`)
                .setLabel("Onayla")
                .setStyle(ButtonStyle.Success);

            const red = new ButtonBuilder()
                .setCustomId(`red_${interaction.user.id}`)
                .setLabel("Reddet")
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(onay, red);

            const embed = new EmbedBuilder()
                .setTitle("Yeni Başvuru")
                .addFields(
                    { name: "Kullanıcı", value: interaction.user.tag },
                    { name: "Yaş", value: yas },
                    { name: "Tecrübe", value: tecrube }
                )
                .setColor("Green");

            await kanal.send({
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: "Başvurunuz gönderildi.",
                ephemeral: true
            });
        }
    }

    // BUTTON
    if (interaction.isButton()) {

        // Ticket kapat
        if (interaction.customId === "close-ticket") {

            await interaction.reply("Ticket kapatılıyor...");

            setTimeout(() => {
                interaction.channel.delete();
            }, 3000);
        }

        // Onay
        if (interaction.customId.startsWith("onay_")) {

            const userId = interaction.customId.split("_")[1];

            const user = await client.users.fetch(userId);

            user.send("🎉 Tebrikler! Başvurunuz onaylandı. Başarılar, sesli mülakata geçebilirsiniz.");

            await interaction.reply("Başvuru onaylandı.");
        }

        // Red
        if (interaction.customId.startsWith("red_")) {

            const userId = interaction.customId.split("_")[1];

            const user = await client.users.fetch(userId);

            user.send("❌ Başvurunuz reddedildi.");

            await interaction.reply("Başvuru reddedildi.");
        }
    }

});

client.login(process.env.TOKEN);
