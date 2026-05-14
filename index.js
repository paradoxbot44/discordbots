const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
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

// ================= MEMORY =================
const xp = new Map();
const msgCount = new Map();
const spam = new Map();
const raid = new Map();

// ================= HELPERS =================
function getResultChannel(guild) {
  return guild.channels.cache.find(c => c.name === "basvuru-sonuc");
}

// ================= READY =================
client.once("ready", () => {
  console.log(`🛡️ GUARDIX V4 FINAL ACTIVE: ${client.user.tag}`);
});

// ================= WELCOME =================
client.on("guildMemberAdd", async (m) => {
  m.guild.systemChannel?.send(`👋 Hoş geldin ${m}! Guardix V4'e katıldın 🛡️`);
  m.send("👋 Sunucuya hoş geldin! Guardix aktif 🛡️").catch(() => {});
});

// ================= MESSAGE SYSTEM =================
client.on("messageCreate", async (m) => {
  if (!m.guild || m.author.bot) return;

  const id = m.author.id;

  // XP + MSG COUNT
  xp.set(id, (xp.get(id) || 0) + 1);
  msgCount.set(id, (msgCount.get(id) || 0) + 1);

  // LEVEL SYSTEM
  if (xp.get(id) % 100 === 0) {
    m.channel.send(`🏆 LEVEL UP: ${m.author}`);
  }

  // PANEL
  if (m.content === "!panel") {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("menu")
      .setPlaceholder("Seçim yap")
      .addOptions([
        { label: "🎫 Ticket Aç", value: "ticket" },
        { label: "🧾 Başvuru", value: "apply" }
      ]);

    return m.channel.send({
      content: "🛡️ GUARDIX PANEL",
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  // EN AKTİF
  if (m.content === "!aktif") {
    const top = [...msgCount.entries()].sort((a,b)=>b[1]-a[1])[0];
    if (top) {
      return m.channel.send(`🔥 EN AKTİF: <@${top[0]}> (${top[1]} mesaj)`);
    }
  }

  // TOP XP
  if (m.content === "!top") {
    const top = [...xp.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
    return m.channel.send(top.map(x => `<@${x[0]}> - ${x[1]} XP`).join("\n"));
  }

  // ================= ANTI-SPAM =================
  const now = Date.now();
  if (!spam.has(id)) spam.set(id, []);
  spam.get(id).push(now);

  const recent = spam.get(id).filter(t => now - t < 4000);
  if (recent.length > 6) {
    m.channel.send(`🚨 SPAM ALGILANDI: ${m.author}`);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (i) => {

  if (!i.isStringSelectMenu()) return;

  // ================= TICKET =================
  if (i.values[0] === "ticket") {

    const ch = await i.guild.channels.create({
      name: `ticket-${i.user.username}`
    });

    const btn = new ButtonBuilder()
      .setCustomId("close")
      .setLabel("Kapat")
      .setStyle(ButtonStyle.Danger);

    ch.send({
      content: `🎫 Ticket Açıldı: ${i.user}`,
      components: [new ActionRowBuilder().addComponents(btn)]
    });

    return i.reply({ content: "Ticket açıldı", ephemeral: true });
  }

  // ================= APPLY =================
  if (i.values[0] === "apply") {

    const modal = new ModalBuilder()
      .setCustomId("form")
      .setTitle("🧾 BAŞVURU FORMU");

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

  // ================= CLOSE TICKET =================
  if (i.isButton() && i.customId === "close") {
    await i.reply({ content: "Ticket kapanıyor...", ephemeral: true });
    setTimeout(() => i.channel.delete().catch(()=>{}), 1200);
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
      .setTitle("🧾 YENİ BAŞVURU")
      .setDescription(
`👤 ${i.user}
🎂 Yaş: ${age}
🧠 Tecrübe: ${exp}
❓ Neden: ${why}`
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
      content: "🛡️ YETKİLİ PANEL",
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(ok, no)]
    });

    return i.reply({ content: "Başvuru gönderildi", ephemeral: true });
  }

  // ================= APPROVE =================
  if (i.isButton() && i.customId.startsWith("ok_")) {

    const id = i.customId.split("_")[1];
    const channel = getResultChannel(i.guild);

    if (channel) {
      channel.send(`🟢 <@${id}> BAŞVURUNUZ ONAYLANDI 🎉`);
    }

    return i.reply({ content: "Onaylandı", ephemeral: true });
  }

  // ================= REJECT =================
  if (i.isButton() && i.customId.startsWith("no_")) {

    const id = i.customId.split("_")[1];
    const channel = getResultChannel(i.guild);

    if (channel) {
      channel.send(`🔴 <@${id}> BAŞVURUNUZ REDDEDİLDİ ❌`);
    }

    return i.reply({ content: "Reddedildi", ephemeral: true });
  }
});

// ================= RAID =================
client.on("guildMemberAdd", (m) => {
  const g = m.guild.id;
  const now = Date.now();

  if (!raid.has(g)) raid.set(g, []);
  raid.get(g).push(now);

  const recent = raid.get(g).filter(t => now - t < 10000);

  if (recent.length > 7) {
    m.guild.systemChannel?.send("🚨 RAID ALGILANDI!");
  }
});

// ================= LOGIN =================
client.login("TOKEN");
