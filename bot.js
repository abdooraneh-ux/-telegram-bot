const { Telegraf } = require('telegraf');

const bot = new Telegraf('8399272057:AAFFdGHrbMmdb3UiMWboNtTSfNlV_QyqcHw');
const userStates = {};

bot.start((ctx) => {
    try {
        delete userStates[ctx.from.id];
        return ctx.reply("أهلاً بك يا عبدو 💻 البوت يعمل الآن بكامل كفاءته وسيظل مستقراً:", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🔤 Base64', callback_data: 'tool_base64' },
                        { text: '📦 تنسيق JSON', callback_data: 'tool_json' }
                    ],
                    [
                        { text: '🔗 توليد QR Code', callback_data: 'tool_qr' },
                        { text: '🛡️ فحص أمان رابط', callback_data: 'tool_url' }
                    ]
                ]
            }
        });
    } catch (err) {
        console.error("Start Error:", err);
    }
});

bot.action('tool_base64', async (ctx) => {
    await ctx.answerCbQuery();
    userStates[ctx.from.id] = 'base64';
    return ctx.reply("🔤 أداة Base64\nأرسل النص لتشفيره.");
});

bot.action('tool_json', async (ctx) => {
    await ctx.answerCbQuery();
    userStates[ctx.from.id] = 'json';
    return ctx.reply("📦 أداة تنسيق JSON\nأرسل كود JSON لترتيبه.");
});

bot.action('tool_qr', async (ctx) => {
    await ctx.answerCbQuery();
    userStates[ctx.from.id] = 'qr';
    return ctx.reply("🔗 أداة QR Code\nأرسل النص لتحويله.");
});

bot.action('tool_url', async (ctx) => {
    await ctx.answerCbQuery();
    userStates[ctx.from.id] = 'url';
    return ctx.reply("🛡️ أداة فحص الرابط\nأرسل الرابط للتحقق منه.");
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;

    try {
        const encoded = Buffer.from(text, 'utf-8').toString('base64');
        return ctx.reply(`✅ النتيجة بـ Base64:\n\`${encoded}\``, { parse_mode: 'Markdown' });
    } catch (e) {
        return ctx.reply("❌ حدث خطأ في معالجة النص.");
    }
});

bot.launch();
console.log("تم تشغيل البوت بنجاح والاتصال بتليجرام!");
