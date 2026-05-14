const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= COMMANDS =================
const commands = [
  new SlashCommandBuilder().setName("panel").setDescription("Panel aç"),
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", () => {
  console.log(`🛡️ GUARDIX V7 ONLINE: ${client.user.tag}`);
});

// ================= REGISTER SLASH =================
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("Slash registered");
  } catch (e) {
    console.log(e);
  }
})();

// ================= PANEL =================
client.on("interactionCreate", async (i) => {

  // ================= SLASH =================
  if (i.isChatInputCommand()) {

    if (i.commandName === "panel") {

      const menu = new StringSelectMenuBuilder()
        .setCustomId("menu")
        .setPlaceholder("Seç")
        .addOptions([
          { label: "🎫 Ticket Aç", value: "ticket" },
          { label: "🧾 Başvuru", value: "apply" }
        ]);

      return i.reply({
        content: "🛡️ PANEL",
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true
      });
    }
  }

  // ================= DROPDOWN =================
  if (i.isStringSelectMenu()) {

    // TICKET
    if (i.values[0] === "ticket") {

      const ch = await i.guild.channels.create({
        name: `ticket-${i.user.username}`,
        permissionOverwrites: [
          {
            id: i.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: i.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          },
          {
            id: "STAFF_ROLE_ID",
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });

      const btn = new ButtonBuilder()
        .setCustomId("close")
        .setLabel("Kapat")
        .setStyle(ButtonStyle.Danger);

      ch.send({
        content: "🎫 Ticket açıldı | 🟡 inceleniyor...",
        components: [new ActionRowBuilder().addComponents(btn)]
      });

      return i.reply({ content: "Ticket açıldı", ephemeral: true });
    }

    // FORM
    if (i.values[0] === "apply") {

      const modal = new ModalBuilder()
        .setCustomId("form")
        .setTitle("Başvuru");

      const age = new TextInputBuilder()
        .setCustomId("age")
        .setLabel("Yaş")
        .setStyle(TextInputStyle.Short);

      const exp = new TextInputBuilder()
        .setCustomId("exp")
        .setLabel("Tecrübe")
        .setStyle(TextInputStyle.Paragraph);

      const why = new TextInputBuilder()
        .setCustomId("why")
        .setLabel("Neden biz?")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(age),
        new ActionRowBuilder().addComponents(exp),
        new ActionRowBuilder().addComponents(why)
      );

      return i.showModal(modal);
    }
  }

  // ================= FORM SUBMIT =================
  if (i.isModalSubmit() && i.customId === "form") {

    const age = i.fields.getTextInputValue("age");
    const exp = i.fields.getTextInputValue("exp");
    const why = i.fields.getTextInputValue("why");

    const ch = await i.guild.channels.create({
      name: `basvuru-${i.user.username}`
    });

    const embed = new EmbedBuilder()
      .setTitle("🧾 BAŞVURU")
      .setDescription(
`👤 ${i.user}
🎂 ${age}
🧠 ${exp}
❓ ${why}`
      );

    const ok = new ButtonBuilder()
      .setCustomId(`ok_${i.user.id}`)
      .setLabel("ONAYLA")
      .setStyle(ButtonStyle.Success);

    const no = new ButtonBuilder()
      .setCustomId(`no_${i.user.id}`)
      .setLabel("REDDET")
      .setStyle(ButtonStyle.Danger);

    ch.send({
      content: "🛡️ BAŞVURU PANEL",
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(ok, no)]
    });

    return i.reply({ content: "Başvuru gönderildi", ephemeral: true });
  }

  // ================= CLOSE TICKET =================
  if (i.isButton() && i.customId === "close") {

    try {
      await i.user.send("🎫 Ticket kapatıldı 🛡️");
    } catch {}

    await i.reply({ content: "Kapatılıyor...", ephemeral: true });

    setTimeout(() => i.channel.delete().catch(() => {}), 1200);
  }

  // ================= APPROVE / REJECT FIX =================
  if (i.isButton() && (i.customId.startsWith("ok_") || i.customId.startsWith("no_"))) {

    const userId = i.customId.split("_")[1];

    let channel = i.guild.channels.cache.find(c => c.name === "basvuru-sonuc");

    // kanal yoksa oluştur
    if (!channel) {
      channel = await i.guild.channels.create({
        name: "basvuru-sonuc"
      });
    }

    if (i.customId.startsWith("ok_")) {
      channel.send(`🟢 <@${userId}> BAŞVURUN ONAYLANDI 🎉`);
      return i.reply({ content: "Onaylandı", ephemeral: true });
    }

    if (i.customId.startsWith("no_")) {
      channel.send(`🔴 <@${userId}> BAŞVURUN REDDEDİLDİ ❌`);
      return i.reply({ content: "Reddedildi", ephemeral: true });
    }
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
