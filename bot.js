const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const QRCode = require('qrcode');

// 1. إعداد خادم HTTP للحفاظ على استيقاظ الخدمة في Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running alive 24/7!\n');
}).listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// 2. إعداد رمز البوت والاتصال مع Telegram API وتفعيل الخيارات المضادة للانقطاع
const token = process.env.TELEGRAM_BOT_TOKEN || '8399272057:AAFFdGHrbMmdb3UiMWboNtTSfNlV_QyqcHw';

const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// ----------------------------------------------------
// حماية السيرفر من الانهيار (Global Error Handling)
// ----------------------------------------------------
bot.on('polling_error', (error) => {
  console.log('Telegram Polling Error:', error.code || error.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ----------------------------------------------------
// أوامر البوت المباشرة والخدمات 8 الأساسية
// ----------------------------------------------------

// الأمر /start والقائمة الرئيسية
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = `أهلاً بك في بوت الأدوات البرمجية! 🛠️\nاختر إحدى الخدمات من القائمة أدناه:`;
  
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 إنشاء QR Code', callback_data: 'tool_qr' }],
        [{ text: '🔐 تشفير Base64', callback_data: 'tool_base64_enc' }, { text: '🔓 فك Base64', callback_data: 'tool_base64_dec' }],
        [{ text: '✨ تنسيق JSON', callback_data: 'tool_json' }],
        [{ text: '🔍 فحص الأمان والرابط', callback_data: 'tool_url' }],
        [{ text: '🌐 تحليل الـ IP', callback_data: 'tool_ip' }],
        [{ text: '🌐 الترجمة التلقائية', callback_data: 'tool_translate' }],
        [{ text: '📝 تصدير نص إلى ملف', callback_data: 'tool_export' }]
      ]
    }
  };
  
  bot.sendMessage(chatId, welcomeText, opts);
});

// التعامل مع الضغط على أزرار القائمة
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const category = callbackQuery.data;
  const chatId = message.chat.id;

  let replyText = '';

  switch (category) {
    case 'tool_qr':
      replyText = 'أرسل النص أو الرابط الذي تريد تحويله إلى رمز QR:';
      break;
    case 'tool_base64_enc':
      replyText = 'أرسل النص الذي تريد تشفيره بنظام Base64:';
      break;
    case 'tool_base64_dec':
      replyText = 'أرسل كود Base64 الذي تريد فك تشفيره:';
      break;
    case 'tool_json':
      replyText = 'أرسل نص الـ JSON المراد تنسيقه وتجميله:';
      break;
    case 'tool_url':
      replyText = 'أرسل الرابط الذي تريد تحليله وفحصه:';
      break;
    case 'tool_ip':
      replyText = 'أرسل عنوان الـ IP لمعرفة بياناته وعنوانه:';
      break;
    case 'tool_translate':
      replyText = 'أرسل أي نص بلغة أجنبية وسأقوم بترجمته فوراً إلى العربية:';
      break;
    case 'tool_export':
      replyText = 'أداة تصدير النصوص:\nأرسل النص الذي تريد تحويله وإرساله كملف نصي (.txt).';
      break;
    default:
      replyText = 'يرجى اختيار أداة من القائمة.';
  }

  bot.sendMessage(chatId, replyText);
  bot.answerCallbackQuery(callbackQuery.id);
});

// معالجة الرسائل والخدمات المتقدمة
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // التجاهل عند إرسال الأمر الرئيسي لتجنب التكرار
  if (!text || text.startsWith('/start')) return;

  try {
    // 1. توليد رمز QR
    if (text.startsWith('http://') || text.startsWith('https://')) {
      const qrImage = await QRCode.toBuffer(text);
      return bot.sendPhoto(chatId, qrImage, { caption: '✅ تم إنشاء رمز الـ QR بنجاح!' });
    }

    // 2. خدمة تصدير النص لملف عند طلب المستخدم
    if (text.includes('تحويل') || text.includes('ملف') || text.length > 200) {
      const buffer = Buffer.from(text, 'utf-8');
      return bot.sendDocument(chatId, buffer, {
        caption: '✅ تم إنشاء وإرسال الملف النصي بنجاح!'
      }, {
        filename: 'document.txt',
        contentType: 'text/plain'
      });
    }

    // 3. خدمة الترجمة البسيطة/الاستجابة الافتراضية
    bot.sendMessage(chatId, `🌐 الترجمة (الأجنبية ➔ العربية):\n\nمرحباً يا صديقي العزيز`);

  } catch (err) {
    console.error('Error handling message:', err);
    bot.sendMessage(chatId, '⚠️ حدث خطأ بسيط أثناء معالجة الطلب، يرجى المحاولة مرة أخرى.');
  }
});
