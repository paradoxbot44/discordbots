const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

require("dotenv").config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});


// SLASH KOMUTLARI
const commands = [

    new SlashCommandBuilder()
        .setName("ticket-kur")
        .setDescription("Ticket paneli kurar"),

    new SlashCommandBuilder()
        .setName("basvuru-kur")
        .setDescription("Başvuru paneli kurar")

].map(cmd => cmd.toJSON());


// BOT HAZIR OLUNCA
client.once("ready", async () => {

    console.log(`${client.user.tag} aktif!`);

    // KOMUT REGISTER
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("Slash komutları register edildi!");

    } catch (err) {
        console.error(err);
    }
});


// ETKİLEŞİMLER
client.on(Events.InteractionCreate, async interaction => {

    // SLASH KOMUTLARI
    if (interaction.isChatInputCommand()) {

        // TICKET PANEL
        if (interaction.commandName === "ticket-kur") {

            const embed = new EmbedBuilder()
                .setTitle("🎫 Destek Sistemi")
                .setDescription("Destek almak için aşağıdaki butona tıkla.")
                .setColor("Blue")
                .setFooter({ text: "Ticket Sistemi" });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_ac")
                    .setLabel("🎫 Ticket Aç")
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.channel.send({
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: "✅ Ticket paneli kuruldu!",
                ephemeral: true
            });
        }

        // BAŞVURU PANEL
        if (interaction.commandName === "basvuru-kur") {

            const embed = new EmbedBuilder()
                .setTitle("📋 Yetkili Başvuru")
                .setDescription("Başvuru yapmak için aşağıdaki butona bas.")
                .setColor("Purple")
                .setFooter({ text: "Başvuru Sistemi" });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("basvuru_ac")
                    .setLabel("📋 Başvuru Yap")
                    .setStyle(ButtonStyle.Success)
            );

            await interaction.channel.send({
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: "✅ Başvuru paneli kuruldu!",
                ephemeral: true
            });
        }
    }

    // BUTONLAR
    if (interaction.isButton()) {

        // TICKET AÇ
        if (interaction.customId === "ticket_ac") {

            const kanal = await interaction.guild.channels.create({
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

            const embed = new EmbedBuilder()
                .setTitle("🎫 Ticket Oluşturuldu")
                .setDescription(`
Hoş geldin ${interaction.user}

Yetkililer yakında seninle ilgilenecek.
                `)
                .setColor("Green");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_kapat")
                    .setLabel("🔒 Ticket Kapat")
                    .setStyle(ButtonStyle.Danger)
            );

            kanal.send({
                content: `${interaction.user}`,
                embeds: [embed],
                components: [row]
            });

            interaction.reply({
                content: `✅ Ticket açıldı: ${kanal}`,
                ephemeral: true
            });
        }

        // BAŞVURU AÇ
        if (interaction.customId === "basvuru_ac") {

            const kanal = await interaction.guild.channels.create({
                name: `basvuru-${interaction.user.username}`,
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

            const embed = new EmbedBuilder()
                .setTitle("📋 Başvuru Formu")
                .setDescription(`
• İsim:
• Yaş:
• Aktiflik:
• Deneyim:
• Neden seni seçelim?
                `)
                .setColor("Purple");

            kanal.send({
                content: `${interaction.user}`,
                embeds: [embed]
            });

            interaction.reply({
                content: `✅ Başvuru kanalın açıldı: ${kanal}`,
                ephemeral: true
            });
        }

        // TICKET KAPAT
        if (interaction.customId === "ticket_kapat") {

            await interaction.reply({
                content: "🔒 Kanal 5 saniye sonra silinecek."
            });

            setTimeout(() => {
                interaction.channel.delete();
            }, 5000);
        }
    }
});

client.login(process.env.TOKEN);
