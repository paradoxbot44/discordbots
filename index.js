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

// ================= DATA =================
const spamMap = new Map();
const xp = new Map();
const msgCount = new Map();

// ================= SLASH COMMANDS =================
const commands = [
  new SlashCommandBuilder().setName("panel").setDescription("Paneli aç"),
  new SlashCommandBuilder().setName("ticket").setDescription("Ticket sistemi"),
  new SlashCommandBuilder().setName("basvuru").setDescription("Başvuru formu"),
  new SlashCommandBuilder().setName("aktif").setDescription("En aktif kullanıcı"),
  new SlashCommandBuilder().setName("top").setDescription("XP sıralama")
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
  console.log(`🛡️ GUARDIX SLASH ONLINE: ${client.user.tag}`);
});

// ================= WELCOME =================
client.on("guildMemberAdd", (m) => {
  const ch = m.guild.channels.cache.find(c => c.name === "karsilama");
  ch?.send(`👋 Hoş geldin ${m} | Guardix aktif 🛡️`);
});

// ================= MESSAGE + ANTI SPAM =================
client.on("messageCreate", (m) => {
  if (!m.guild || m.author.bot) return;

  const id = m.author.id;

  if (!spamMap.has(id)) spamMap.set(id, []);

  const now = Date.now();
  const arr = spamMap.get(id);

  arr.push(now);

  const recent = arr.filter(t => now - t < 10000);
  spamMap.set(id, recent);

  if (recent.length >= 10) {
    m.guild.members.fetch(id).then(member => {
      if (member.moderatable) {
        member.timeout(60 * 1000, "Spam").catch(() => {});
      }
    });

    m.channel.send(`🚨 ${m.author} spam yasak ❌ (1 dk mute)`);
  }

  xp.set(id, (xp.get(id) || 0) + 1);
  msgCount.set(id, (msgCount.get(id) || 0) + 1);
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (i) => {

  // ================= SLASH =================
  if (i.isChatInputCommand()) {

    // PANEL
    if (i.commandName === "panel") {

      const menu = new StringSelectMenuBuilder()
        .setCustomId("menu")
        .setPlaceholder("Seç")
        .addOptions([
          { label: "🎫 Ticket Aç", value: "ticket" },
          { label: "🧾 Başvuru", value: "apply" }
        ]);

      return i.reply({
        content: "🛡️ GUARDIX PANEL",
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true
      });
    }

    // TICKET
    if (i.commandName === "ticket") {
      return i.reply({ content: "Panelden aç: /panel", ephemeral: true });
    }

    // AKTİF
    if (i.commandName === "aktif") {
      const top = [...msgCount.entries()].sort((a,b)=>b[1]-a[1])[0];
      return i.reply(`🔥 EN AKTİF: <@${top[0]}>`);
    }

    // TOP
    if (i.commandName === "top") {
      const top = [...xp.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
      return i.reply(top.map(x => `<@${x[0]}> - ${x[1]} XP`).join("\n"));
    }
  }

  // ================= DROPDOWN =================
  if (i.isStringSelectMenu()) {

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
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          },
          {
            id: "STAFF_ROLE_ID",
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      ch.send(`🎫 Ticket açıldı\n🟡 inceleniyor...\n⏳ bekleyiniz`);

      const btn = new ButtonBuilder()
        .setCustomId("close")
        .setLabel("Kapat")
        .setStyle(ButtonStyle.Danger);

      ch.send({ components: [new ActionRowBuilder().addComponents(btn)] });

      return i.reply({ content: "Ticket açıldı", ephemeral: true });
    }

    // ================= FORM =================
    if (i.values[0] === "apply") {

      const modal = new ModalBuilder()
        .setCustomId("form")
        .setTitle("🧾 BAŞVURU");

      const q1 = new TextInputBuilder()
        .setCustomId("age")
        .setLabel("Yaş")
        .setStyle(TextInputStyle.Short);

      const q2 = new TextInputBuilder()
        .setCustomId("exp")
        .setLabel("Tecrübe")
        .setStyle(TextInputStyle.Paragraph);

      const q3 = new TextInputBuilder()
        .setCustomId("why")
        .setLabel("Neden biz?")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(q1),
        new ActionRowBuilder().addComponents(q2),
        new ActionRowBuilder().addComponents(q3)
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
      .setDescription(`${i.user}\n${age}\n${exp}\n${why}`);

    const ok = new ButtonBuilder()
      .setCustomId(`ok_${i.user.id}`)
      .setLabel("ONAYLA")
      .setStyle(ButtonStyle.Success);

    const no = new ButtonBuilder()
      .setCustomId(`no_${i.user.id}`)
      .setLabel("REDDET")
      .setStyle(ButtonStyle.Danger);

    ch.send({
      content: "🛡️ YETKİLİ PANEL",
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(ok, no)]
    });

    return i.reply({ content: "Başvuru gönderildi", ephemeral: true });
  }

  // ================= CLOSE =================
  if (i.isButton() && i.customId === "close") {

    try {
      await i.user.send("🎫 Ticket kapatıldı 🛡️");
    } catch {}

    await i.reply({ content: "Kapatılıyor...", ephemeral: true });

    setTimeout(() => i.channel.delete().catch(()=>{}), 1200);
  }

  // ================= ONAY / RED =================
  if (i.isButton() && i.customId.startsWith("ok_")) {
    const id = i.customId.split("_")[1];
    const ch = i.guild.channels.cache.find(c => c.name === "basvuru-sonuc");
    ch?.send(`🟢 <@${id}> ONAYLANDI 🎉`);
    return i.reply({ ephemeral: true, content: "OK" });
  }

  if (i.isButton() && i.customId.startsWith("no_")) {
    const id = i.customId.split("_")[1];
    const ch = i.guild.channels.cache.find(c => c.name === "basvuru-sonuc");
    ch?.send(`🔴 <@${id}> REDDEDİLDİ ❌`);
    return i.reply({ ephemeral: true, content: "NO" });
  }
});

// ================= SLASH REGISTER =================
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("Slash commands yüklendi");
  } catch (e) {
    console.log(e);
  }
})();

// ================= LOGIN =================
client.login(process.env.TOKEN);
