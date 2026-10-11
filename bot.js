const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const QRCode = require('qrcode');

// 1. خادم HTTP للبقاء نشطاً على Render (24/7)
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

// ذاكرة لتتبع حالة المستخدم
const userState = {};

// القائمة الرئيسية
const mainKeyboard = {
  inline_keyboard: [
    [{ text: '📱 إنشاء QR Code', callback_data: 'tool_qr' }],
    [{ text: '🔐 تشفير Base64', callback_data: 'tool_base64_enc' }, { text: '🔓 فك Base64', callback_data: 'tool_base64_dec' }],
    [{ text: '🔢 تشفير أنظمة أعداد', callback_data: 'tool_num_enc' }, { text: '🔓 فك أنظمة أعداد', callback_data: 'tool_num_dec' }],
    [{ text: '✨ تنسيق JSON ملون', callback_data: 'tool_json' }],
    [{ text: '🔍 فحص الأمان والرابط', callback_data: 'tool_url' }],
    [{ text: '🌐 تحليل الـ IP', callback_data: 'tool_ip' }],
    [{ text: '📝 تصدير نص إلى ملف', callback_data: 'tool_export' }]
  ]
};

// زر العودة والإلغاء
const backKeyboard = {
  inline_keyboard: [
    [{ text: '🔙 إلغاء / العودة للقائمة', callback_data: 'main_menu' }]
  ]
};

// الأمر /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = null;
  bot.sendMessage(chatId, `أهلاً بك في بوت الأدوات البرمجية الشامل! 🛠️\nاختر الخدمة المطلوبة من القائمة أدناه:`, {
    reply_markup: mainKeyboard
  });
});

// معالجة الضغط على الأزرار
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const category = callbackQuery.data;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  if (category === 'main_menu') {
    userState[chatId] = null;
    try {
      await bot.editMessageText(`أهلاً بك في بوت الأدوات البرمجية الشامل! 🛠️\nاختر الخدمة المطلوبة من القائمة أدناه:`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: mainKeyboard
      });
    } catch (e) {
      bot.sendMessage(chatId, `القائمة الرئيسية:`, { reply_markup: mainKeyboard });
    }
    bot.answerCallbackQuery(callbackQuery.id);
    return;
  }

  userState[chatId] = category;

  let replyText = '';
  switch (category) {
    case 'tool_qr':
      replyText = '📱 أرسل النص، الرابط، أو الرقم لتحويله إلى رمز QR:';
      break;
    case 'tool_base64_enc':
      replyText = '🔐 أرسل النص المراد تشفيره بنظام Base64:';
      break;
    case 'tool_base64_dec':
      replyText = '🔓 أرسل كود Base64 لفك تشفيره:';
      break;
    case 'tool_num_enc':
      replyText = '🔢 أرسل النص المراد تشفيره بالأنظمة العددية (Binary, Octal, Decimal, Hex):';
      break;
    case 'tool_num_dec':
      replyText = '🔓 أرسل القيم العددية المفصولة بمسافات لفك تشفيرها إلى نص:';
      break;
    case 'tool_json':
      replyText = '✨ أرسل نص الـ JSON لتنسيقه وتلوينه:';
      break;
    case 'tool_url':
      replyText = '🔍 أرسل الرابط لفحص أمانه وكشف التهديدات:';
      break;
    case 'tool_ip':
      replyText = '🌐 أرسل عنوان الـ IP لتحليله وفحص الكلاس والبايتات:';
      break;
    case 'tool_export':
      replyText = '📝 أرسل النص المراد تصديره كملف نصي (.txt):';
      break;
    default:
      replyText = 'اختر أداة من القائمة.';
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

// معالجة النصوص وتنفيذ الأدوات
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/start')) return;

  const currentTool = userState[chatId];
  if (!currentTool) return;

  try {
    switch (currentTool) {
      // 1. إنشاء QR
      case 'tool_qr': {
        const qrImage = await QRCode.toBuffer(text);
        userState[chatId] = null;
        return bot.sendPhoto(chatId, qrImage, { 
          caption: '✅ تم إنشاء رمز الـ QR بنجاح!',
          reply_markup: mainKeyboard
        });
      }

      // 2. تشفير Base64
      case 'tool_base64_enc': {
        const encoded = Buffer.from(text, 'utf-8').toString('base64');
        userState[chatId] = null;
        return bot.sendMessage(chatId, `🔐 **النص المشفر بـ Base64:**\n\`${encoded}\``, {
          parse_mode: 'Markdown',
          reply_markup: mainKeyboard
        });
      }

      // 3. فك تشفير Base64
      case 'tool_base64_dec': {
        try {
          const decoded = Buffer.from(text, 'base64').toString('utf-8');
          userState[chatId] = null;
          return bot.sendMessage(chatId, `🔓 **النص المفكوك:**\n${decoded}`, {
            reply_markup: mainKeyboard
          });
        } catch (err) {
          return bot.sendMessage(chatId, '⚠️ كود Base64 غير صالح، أعد إرساله بشكل صحيح:', { reply_markup: backKeyboard });
        }
      }

      // 4. تشفير الأنظمة العددية
      case 'tool_num_enc': {
        const buffer = Buffer.from(text, 'utf-8');
        const binary = Array.from(buffer).map(b => b.toString(2).padStart(8, '0')).join(' ');
        const octal = Array.from(buffer).map(b => b.toString(8).padStart(3, '0')).join(' ');
        const decimal = Array.from(buffer).map(b => b.toString(10)).join(' ');
        const hex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' ');

        userState[chatId] = null;
        const resMsg = `🔢 **التشفير بالأنظمة العددية:**\n\n` +
          `🔹 **Binary (ثنائي):**\n\`${binary}\`\n\n` +
          `🔹 **Octal (ثماني):**\n\`${octal}\`\n\n` +
          `🔹 **Decimal (عشري):**\n\`${decimal}\`\n\n` +
          `🔹 **Hexadecimal (ست عشري):**\n\`${hex}\``;

        return bot.sendMessage(chatId, resMsg, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
      }

      // 5. فك تشفير الأنظمة العددية
      case 'tool_num_dec': {
        try {
          const parts = text.trim().split(/\s+/);
          let decoded = '';

          if (parts[0].length === 8 && /^[01]+$/.test(parts[0])) {
            decoded = Buffer.from(parts.map(p => parseInt(p, 2))).toString('utf-8');
          } else if (/^[0-7]+$/.test(parts[0]) && parts[0].length === 3) {
            decoded = Buffer.from(parts.map(p => parseInt(p, 8))).toString('utf-8');
          } else if (/^[0-9a-fA-F]{2}$/.test(parts[0])) {
            decoded = Buffer.from(parts.map(p => parseInt(p, 16))).toString('utf-8');
          } else if (!isNaN(parts[0])) {
            decoded = Buffer.from(parts.map(p => parseInt(p, 10))).toString('utf-8');
          } else {
            throw new Error('Invalid format');
          }

          userState[chatId] = null;
          return bot.sendMessage(chatId, `🔓 **النص المفكوك:**\n${decoded}`, { reply_markup: mainKeyboard });
        } catch (e) {
          return bot.sendMessage(chatId, '⚠️ القيم العددية غير صالحة. يرجى إرسال قيم صحيحة مفصولة بمسافات:', { reply_markup: backKeyboard });
        }
      }

      // 6. تنسيق JSON ملون
      case 'tool_json': {
        try {
          const parsed = JSON.parse(text);
          const formatted = JSON.stringify(parsed, null, 2);
          userState[chatId] = null;
          return bot.sendMessage(chatId, `✨ **JSON منسق بوضوح:**\n\`\`\`json\n${formatted}\n\`\`\``, {
            parse_mode: 'Markdown',
            reply_markup: mainKeyboard
          });
        } catch (err) {
          return bot.sendMessage(chatId, '⚠️ صيغة JSON غير صالحة، يرجى إرسال نص JSON صحيح:', { reply_markup: backKeyboard });
        }
      }

      // 7. فحص أمان الرابط
      case 'tool_url': {
        userState[chatId] = null;
        let isSafe = true;
        let warnings = [];

        if (text.includes('trycloudflare.com') || text.includes('ngrok-free.app') || text.includes('loca.lt')) {
          isSafe = false;
          warnings.push('الرابط يستخدم خدمة أنفاق مؤقتة (Tunneling) وغالباً ما يُستخدم للتصيد وسرقة البيانات.');
        }
        if (!text.startsWith('https://')) {
          isSafe = false;
          warnings.push('الرابط لا يستخدم بروتوكول الحماية المشفر HTTPS.');
        }

        const statusText = isSafe ? '✅ الرابط موثوق وآمن للاستخدام.' : '⚠️ تحذير: الرابط غير موثوق وخطر!';
        const detailsText = warnings.length > 0 ? warnings.join('\n- ') : 'تم الفحص ولم يتم رصد تهديدات.';

        return bot.sendMessage(chatId, `🔍 **نتيجة فحص الأمان:**\n\n- **الرابط:** ${text}\n- **النتيجة:** ${statusText}\n- **التفاصيل:**\n- ${detailsText}`, {
          reply_markup: mainKeyboard
        });
      }

      // 8. تحليل IP (Class + Bytes)
      case 'tool_ip': {
        userState[chatId] = null;
        const ipParts = text.trim().split('.');
        if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) {
          return bot.sendMessage(chatId, '⚠️ عنوان IP غير صالح، يرجى إرسال IP صحيح مثل (192.168.1.1):', { reply_markup: backKeyboard });
        }

        const firstOctet = parseInt(ipParts[0], 10);
        let ipClass = '';
        let netBytes = 0;
        let hostBytes = 0;

        if (firstOctet >= 1 && firstOctet <= 126) {
          ipClass = 'Class A';
          netBytes = 1;
          hostBytes = 3;
        } else if (firstOctet >= 128 && firstOctet <= 191) {
          ipClass = 'Class B';
          netBytes = 2;
          hostBytes = 2;
        } else if (firstOctet >= 192 && firstOctet <= 223) {
          ipClass = 'Class C';
          netBytes = 3;
          hostBytes = 1;
        } else if (firstOctet >= 224 && firstOctet <= 239) {
          ipClass = 'Class D (Multicast)';
          netBytes = 4;
          hostBytes = 0;
        } else if (firstOctet >= 240 && firstOctet <= 255) {
          ipClass = 'Class E (Experimental)';
          netBytes = 4;
          hostBytes = 0;
        } else {
          ipClass = 'Loopback / Special IP';
        }

        const resMsg = `🌐 **تحليل عنوان الـ IP (${text}):**\n\n` +
          `- **الفئة (Class):** ${ipClass}\n` +
          `- **بايتات الشبكة (Network Bytes):** ${netBytes} Byte (${netBytes * 8} Bits)\n` +
          `- **بايتات المضيف (Host Bytes):** ${hostBytes} Byte (${hostBytes * 8} Bits)`;

        return bot.sendMessage(chatId, resMsg, { reply_markup: mainKeyboard });
      }

      // 9. تصدير نص إلى ملف
      case 'tool_export': {
        const buffer = Buffer.from(text, 'utf-8');
        userState[chatId] = null;
        return bot.sendDocument(chatId, buffer, {
          caption: '✅ تم إنشاء وإرسال الملف النصي بنجاح!',
          reply_markup: mainKeyboard
        }, {
          filename: 'document.txt',
          contentType: 'text/plain'
        });
      }

      default:
        userState[chatId] = null;
        break;
    }
  } catch (err) {
    console.error('Error:', err);
    userState[chatId] = null;
    bot.sendMessage(chatId, '⚠️ حدث خطأ أثناء المعالجة، يرجى المحاولة مرة أخرى.', { reply_markup: mainKeyboard });
  }
});
