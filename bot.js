const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const QRCode = require('qrcode');

// 1. خادم HTTP للبقاء نشطاً على Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running alive 24/7!\n');
}).listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

const token = process.env.TELEGRAM_BOT_TOKEN || '8399272057:AAFFdGHrbMmdb3UiMWboNtTSfNlV_QyqcHw';
const bot = new TelegramBot(token, {
  polling: { interval: 300, autoStart: true, params: { timeout: 10 } }
});

// حماية السيرفر من الانهيار
bot.on('polling_error', (error) => console.log('Polling Error:', error.code || error.message));
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

// تخزين الحالة المؤقتة للمستخدمين (لتحديد الأداة المختارة)
const userState = {};

// أزرار القائمة الرئيسية
const mainKeyboard = {
  inline_keyboard: [
    [{ text: '📱 إنشاء QR Code', callback_data: 'tool_qr' }],
    [{ text: '🔐 تشفير Base64', callback_data: 'tool_base64_enc' }, { text: '🔓 فك Base64', callback_data: 'tool_base64_dec' }],
    [{ text: '✨ تنسيق JSON', callback_data: 'tool_json' }],
    [{ text: '🔍 فحص الأمان والرابط', callback_data: 'tool_url' }],
    [{ text: '🌐 تحليل الـ IP', callback_data: 'tool_ip' }],
    [{ text: '🌐 الترجمة التلقائية', callback_data: 'tool_translate' }],
    [{ text: '📝 تصدير نص إلى ملف', callback_data: 'tool_export' }]
  ]
};

// زر العودة للقائمة الرئيسية
const backKeyboard = {
  inline_keyboard: [
    [{ text: '🔙 إلغاء / العودة للقائمة', callback_data: 'main_menu' }]
  ]
};

// الأمر /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = null; // إعادة تعيين الحالة
  bot.sendMessage(chatId, `أهلاً بك في بوت الأدوات البرمجية! 🛠️\nاختر إحدى الخدمات من القائمة أدناه:`, {
    reply_markup: mainKeyboard
  });
});

// التعامل مع الأزرار
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const category = callbackQuery.data;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  if (category === 'main_menu') {
    userState[chatId] = null; // مسح الحالة عند الرجوع
    try {
      await bot.editMessageText(`أهلاً بك في بوت الأدوات البرمجية! 🛠️\nاختر إحدى الخدمات من القائمة أدناه:`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: mainKeyboard
      });
    } catch (e) {
      bot.sendMessage(chatId, `أهلاً بك من جديد في القائمة الرئيسية:`, { reply_markup: mainKeyboard });
    }
    bot.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // حفظ الأداة التي اختارها المستخدم في الذاكرة المؤقتة
  userState[chatId] = category;

  let replyText = '';
  switch (category) {
    case 'tool_qr':
      replyText = '📱 أرسل النص أو الرابط أو الرقم الذي تريد تحويله إلى رمز QR:';
      break;
    case 'tool_base64_enc':
      replyText = '🔐 أرسل النص الذي تريد تشفيره بنظام Base64:';
      break;
    case 'tool_base64_dec':
      replyText = '🔓 أرسل كود Base64 الذي تريد فك تشفيره:';
      break;
    case 'tool_json':
      replyText = '✨ أرسل نص الـ JSON المراد تنسيقه وتجميله:';
      break;
    case 'tool_url':
      replyText = '🔍 أرسل الرابط الذي تريد تحليله وفحصه:';
      break;
    case 'tool_ip':
      replyText = '🌐 أرسل عنوان الـ IP لمعرفة بياناته وعنوانه:';
      break;
    case 'tool_translate':
      replyText = '🌐 أرسل أي نص بلغة أجنبية وسأقوم بترجمته فوراً إلى العربية:';
      break;
    case 'tool_export':
      replyText = '📝 أداة تصدير النصوص:\nأرسل النص الذي تريد تحويله وإرساله كملف نصي (.txt).';
      break;
    default:
      replyText = 'يرجى اختيار أداة من القائمة.';
  }

  try {
    await bot.editMessageText(replyText, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: backKeyboard
    });
  } catch (e) {
    bot.sendMessage(chatId, replyText, { reply_markup: backKeyboard });
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// معالجة النصوص المرسلة بناءً على الأداة المختارة فقط
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/start')) return;

  const currentTool = userState[chatId];

  // إذا لم يختار المستخدم أي أداة بعد، لا نفعل شيئاً مزعجاً
  if (!currentTool) return;

  try {
    if (currentTool === 'tool_qr') {
      const qrImage = await QRCode.toBuffer(text);
      userState[chatId] = null; // إعادة تعيين الحالة بعد الإنجاز
      return bot.sendPhoto(chatId, qrImage, { 
        caption: '✅ تم إنشاء رمز الـ QR بنجاح!',
        reply_markup: mainKeyboard
      });
    }

    // هنا يمكنك إضافة بقية الأدوات لاحقاً حسب الحاجة
    
  } catch (err) {
    console.error('Error:', err);
    bot.sendMessage(chatId, '⚠️ حدث خطأ أثناء المعالجة، يرجى المحاولة مرة أخرى.', { reply_markup: backKeyboard });
  }
});
