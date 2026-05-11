-0
+45
    await interaction.reply({ content: '@everyone', embeds: [embed], allowedMentions: { parse: ['everyone'] } });
  }
  if (commandName === 'kapali') {
    const sebep = interaction.options.getString('sebep') || 'Belirtilmedi';
    const sure = interaction.options.getString('sure') || null;
    const logoUrl = client.user.displayAvatarURL({ size: 512 });
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setAuthor({ name: 'Guardix FiveM', iconURL: logoUrl })
      .setTitle('🔴 SUNUCU KAPALI')
      .setDescription(
        '```diff\n- ❌ Sunucumuz şu an bakımda veya kapalı.\n```\n' +
        '> Açıldığında tekrar duyurulacak, takipte kalın!'
      )
      .setThumbnail(logoUrl)
      .addFields(
        {
          name: '📊 Sunucu Durumu',
          value: '```ansi\n\u001b[2;31m● OFFLİNE\u001b[0m\n```',
          inline: true,
        },
        {
          name: '❓ Kapatma Sebebi',
          value: `\`\`\`${sebep}\`\`\``,
          inline: true,
        },
        { name: '\u200b', value: '\u200b', inline: true },
      );
    if (sure) {
      embed.addFields({ name: '⏳ Tahmini Açılış', value: `\`\`\`${sure}\`\`\`` });
    }
    embed
      .addFields(
        { name: '📢 Duyuran', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🕐 Saat', value: `<t:${Math.floor(Date.now() / 1000)}:T>`, inline: true },
      )
      .setImage(logoUrl)
      .setFooter({ text: 'Guardix FiveM • Yakında görüşürüz! 🙏', iconURL: logoUrl })
      .setTimestamp();
