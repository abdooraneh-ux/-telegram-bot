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

// دالة إرسال القائمة الرئيسية مع زر الإلغاء/الرئيسية
const sendMainMenu = (chatId, messageId = null) => {
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

  if (messageId) {
    bot.editMessageText(welcomeText, { chat_id: chatId, message_id: messageId, reply_markup: opts.reply_markup });
  } else {
    bot.sendMessage(chatId, welcomeText, opts);
  }
};

// الأمر /start
bot.onText(/\/start/, (msg) => {
  sendMainMenu(msg.chat.id);
});

// التعامل مع الأزرار وزر الإلغاء/الرئيسية
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const category = callbackQuery.data;
  const chatId = message.chat.id;

  if (category === 'main_menu') {
    sendMainMenu(chatId, message.message_id);
    bot.answerCallbackQuery(callbackQuery.id);
    return;
  }

  let replyText = '';
  const backButton = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 إلغاء / القائمة الرئيسية', callback_data: 'main_menu' }]
      ]
    }
  };

  switch (category) {
    case 'tool_qr':
      replyText = '📱 أرسل النص أو الرابط الذي تريد تحويله إلى رمز QR:';
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

  bot.sendMessage(chatId, replyText, backButton);
  bot.answerCallbackQuery(callbackQuery.id);
});

// معالجة الرسائل النصية بطريقة دقيقة
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/start')) return;

  try {
    // 1. توليد QR Code إذا كان رابطاً
    if (text.startsWith('http://') || text.startsWith('https://')) {
      const qrImage = await QRCode.toBuffer(text);
      return bot.sendPhoto(chatId, qrImage, { 
        caption: '✅ تم إنشاء رمز الـ QR بنجاح!',
        reply_markup: { inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] }
      });
    }

    // 2. تصدير نص إلى ملف
    if (text.length > 100 || text.includes('ملف')) {
      const buffer = Buffer.from(text, 'utf-8');
      return bot.sendDocument(chatId, buffer, {
        caption: '✅ تم إنشاء وإرسال الملف النصي بنجاح!'
      }, {
        filename: 'document.txt',
        contentType: 'text/plain'
      });
    }

    // الرد الافتراضي في حال لم تطابق الشروط السابقة (بدون تكرار مزعج)
    bot.sendMessage(chatId, '💡 أرسلت رسالة نصية. يمكنك اختيار أداة من القائمة الرئيسية للتعامل معها:', {
      reply_markup: { inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] }
    });

  } catch (err) {
    console.error('Error:', err);
    bot.sendMessage(chatId, '⚠️ حدث خطأ أثناء المعالجة، يرجى المحاولة مرة أخرى.');
  }
});
