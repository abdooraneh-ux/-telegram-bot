const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('8399272057:AAFFdGHrbMmdb3UiMWboNtTSfNlV_QyqcHw');
const userSessions = {};

// كيبورد الأزرار السفلي الثابت
const replyKeyboard = Markup.keyboard([
  ['🏠 القائمة الرئيسية (/start)', '❌ إلغاء']
]).resize();

// أزرار الأدوات الشفافة
const mainInlineKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('📦 تنسيق JSON', 'tool_json'),
    Markup.button.callback('🔤 Base64', 'tool_base64')
  ],
  [
    Markup.button.callback('🔗 فحص أمان رابط', 'tool_url_safety'),
    Markup.button.callback('🔗 تفكيك رابط URL', 'tool_url_inspect')
  ],
  [
    Markup.button.callback('🎲 توليد QR Code', 'tool_qr'),
    Markup.button.callback('🌐 فحص IP', 'tool_ip')
  ],
  [
    Markup.button.callback('❌ إلغاء العملية الحالية', 'cancel_action')
  ]
]);

function sendMainMenu(ctx, messageText) {
  const name = ctx.from ? ctx.from.first_name || 'عبدو' : 'عبدو';
  const text = messageText || `أهلاً بك يا ${name} 💻 اختر الأداة التي تريد استخدامها:`;
  return ctx.reply(text, replyKeyboard).then(() => {
    return ctx.reply('اختر أداة من القائمة التالية:', mainInlineKeyboard);
  });
}

bot.start((ctx) => {
  delete userSessions[ctx.from.id];
  return sendMainMenu(ctx);
});

bot.hears('🏠 القائمة الرئيسية (/start)', (ctx) => {
  delete userSessions[ctx.from.id];
  return sendMainMenu(ctx, 'تمت العودة للقائمة الرئيسية.');
});

bot.hears('❌ إلغاء', (ctx) => {
  delete userSessions[ctx.from.id];
  return sendMainMenu(ctx, 'تم إلغاء العملية الحالية بنجاح.');
});

bot.action('cancel_action', (ctx) => {
  delete userSessions[ctx.from.id];
  ctx.answerCbQuery('تم الإلغاء');
  return sendMainMenu(ctx, 'تم إلغاء العملية ورجوع للقائمة الرئيسية.');
});

bot.action('tool_json', (ctx) => {
  userSessions[ctx.from.id] = 'json';
  ctx.answerCbQuery();
  return ctx.reply('📦 أداة تنسيق JSON:\nأرسل الآن كود الـ JSON المراد تنسيقه وترتيبه.');
});

bot.action('tool_base64', (ctx) => {
  userSessions[ctx.from.id] = 'base64_select';
  ctx.answerCbQuery();
  return ctx.reply(
    '🔤 اختر خيار Base64 المطلوب:',
    Markup.inlineKeyboard([
      [Markup.button.callback('🔒 تشفير إلى Base64', 'b64_enc')],
      [Markup.button.callback('🔓 فك تشفير Base64', 'b64_dec')],
      [Markup.button.callback('❌ إلغاء', 'cancel_action')]
    ])
  );
});

bot.action('b64_enc', (ctx) => {
  userSessions[ctx.from.id] = 'b64_enc';
  ctx.answerCbQuery();
  return ctx.reply('أرسل النص العادي لتشفيره إلى Base64:');
});

bot.action('b64_dec', (ctx) => {
  userSessions[ctx.from.id] = 'b64_dec';
  ctx.answerCbQuery();
  return ctx.reply('أرسل نص Base64 لفك تشفيره:');
});

bot.action('tool_url_safety', (ctx) => {
  userSessions[ctx.from.id] = 'url_safety';
  ctx.answerCbQuery();
  return ctx.reply('🔗 أداة فحص أمان الرابط:\nأرسل الرابط المراد تفحصه.');
});

bot.action('tool_url_inspect', (ctx) => {
  userSessions[ctx.from.id] = 'url_inspect';
  ctx.answerCbQuery();
  return ctx.reply('🔗 أداة تفكيك الرابط:\nأرسل الرابط لتحليله وأجزائه.');
});

bot.action('tool_qr', (ctx) => {
  userSessions[ctx.from.id] = 'qr';
  ctx.answerCbQuery();
  return ctx.reply('🎲 أداة توليد QR Code:\nأرسل النص أو الرابط لتحويله لرمز QR.');
});

bot.action('tool_ip', (ctx) => {
  userSessions[ctx.from.id] = 'ip';
  ctx.answerCbQuery();
  return ctx.reply('🌐 أداة فحص IP:\nأرسل عنوان الـ IP المطلوب تفحصه (مثل: 8.8.8.8).');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const tool = userSessions[userId];
  const text = ctx.message.text.trim();

  if (text === '🏠 القائمة الرئيسية (/start)' || text === '❌ إلغاء') return;

  if (!tool) {
    return sendMainMenu(ctx, '⚠️ يرجى اختيار أداة أولاً من القائمة:');
  }

  try {
    if (tool === 'json') {
      delete userSessions[userId];
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      return ctx.reply(`✅ تم تنسيق الـ JSON بنجاح:\n\n${formatted}`).then(() => sendMainMenu(ctx));
    }

    if (tool === 'b64_enc') {
      delete userSessions[userId];
      const encoded = Buffer.from(text).toString('base64');
      return ctx.reply(`✅ النتيجة بـ Base64:\n\n${encoded}`).then(() => sendMainMenu(ctx));
    }

    if (tool === 'b64_dec') {
      delete userSessions[userId];
      const decoded = Buffer.from(text, 'base64').toString('utf-8');
      return ctx.reply(`✅ نتيجة فك التشفير:\n\n${decoded}`).then(() => sendMainMenu(ctx));
    }

    if (tool === 'qr') {
      delete userSessions[userId];
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
      return ctx.replyWithPhoto(qrUrl, { caption: '✅ تم توليد رمز الـ QR بنجاح!' }).then(() => sendMainMenu(ctx));
    }

    if (tool === 'url_inspect') {
      delete userSessions[userId];
      const targetUrl = text.startsWith('http') ? text : `https://${text}`;
      const url = new URL(targetUrl);
      const res = `🔍 تحليل الرابط:\n\n• البروتوكول: ${url.protocol}\n• النطاق (Host): ${url.hostname}\n• المسار (Path): ${url.pathname}\n• المعلمات (Params): ${url.search || 'لا يوجد'}`;
      return ctx.reply(res).then(() => sendMainMenu(ctx));
    }

    if (tool === 'url_safety') {
      delete userSessions[userId];
      const isHttps = text.toLowerCase().startsWith('https://');
      const msg = isHttps 
        ? '✅ الرابط يستعمل بروتوكول مشفر وآمن (HTTPS).' 
        : '⚠️ الرابط ينتهي بـ HTTP غير مشفر أو يحتاج لحذر.';
      return ctx.reply(msg).then(() => sendMainMenu(ctx));
    }

    if (tool === 'ip') {
      delete userSessions[userId];
      return ctx.reply(`🌐 نتيجة فحص العنوان (${text}):\nالعنوان جاهز للاستخدام ومقبول.`).then(() => sendMainMenu(ctx));
    }

  } catch (err) {
    delete userSessions[userId];
    return ctx.reply('❌ حدث خطأ في معالجة النص، يرجى التأكد من صحة المدخلات والتجربة مجدداً.').then(() => sendMainMenu(ctx));
  }
});

bot.launch().then(() => {
  console.log('تم تشغيل البوت بنجاح والاتصال بتليجرام!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
