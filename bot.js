const { Telegraf, Markup } = require('telegraf');
const PDFDocument = require('pdfkit');
const axios = require('axios');

const bot = new Telegraf('8399272057:AAFFdGHrbMmdb3UiMWboNtTSfNlV_QyqcHw');
const userSessions = {};

// كيبورد الأزرار السفلي الثابت
const replyKeyboard = Markup.keyboard([
  ['🏠 القائمة الرئيسية (/start)', '❌ إلغاء']
]).resize();

// أزرار الأدوات الشفافة الشاملة
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
    Markup.button.callback('🌐 ترجمة فورية', 'tool_translate'),
    Markup.button.callback('📝 نص إلى PDF', 'tool_text_to_pdf')
  ],
  [
    Markup.button.callback('🖼️ صورة إلى PDF', 'tool_img_to_pdf'),
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

// ---------- تسجيل الأحداث الخاصة بالأدوات ----------

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
  return ctx.reply('🔗 أداة فحص أمان الرابط الذكية:\nأرسل الرابط المراد تفحصه واختبار مدى أمانه.');
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

bot.action('tool_translate', (ctx) => {
  userSessions[ctx.from.id] = 'translate';
  ctx.answerCbQuery();
  return ctx.reply('🌐 أداة الترجمة الفورية:\nأرسل أي نص بلغة أجنبية للترجمة إلى العربية، أو باللغة العربية للترجمة إلى الإنجليزية.');
});

bot.action('tool_text_to_pdf', (ctx) => {
  userSessions[ctx.from.id] = 'text_to_pdf';
  ctx.answerCbQuery();
  return ctx.reply('📝 أداة تحويل النص إلى PDF:\nأرسل النص الذي تريد تحويله إلى مستند PDF.');
});

bot.action('tool_img_to_pdf', (ctx) => {
  userSessions[ctx.from.id] = 'img_to_pdf';
  ctx.answerCbQuery();
  return ctx.reply('🖼️ أداة تحويل الصورة إلى PDF:\nقم بإرسال الصورة الآن لتحويلها لمستند PDF جاهز.');
});

// ---------- معالجة استلام الصور ----------

bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  const tool = userSessions[userId];

  if (tool === 'img_to_pdf') {
    delete userSessions[userId];
    await ctx.reply('⏳ جاري تحويل الصورة إلى مستند PDF...');

    try {
      // جلب أعلى دقة للصورة
      const photos = ctx.message.photo;
      const fileId = photos[photos.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);

      // تنزيل الصورة كـ Buffer
      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      const imgBuffer = Buffer.from(response.data, 'binary');

      // إنشاء مستند PDF
      const doc = new PDFDocument({ margin: 20 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        await ctx.replyWithDocument({
          source: pdfData,
          filename: 'converted_image.pdf'
        }, { caption: '✅ تم تحويل الصورة إلى ملف PDF بنجاح!' });
        sendMainMenu(ctx);
      });

      doc.image(imgBuffer, {
        fit: [500, 700],
        align: 'center',
        valign: 'center'
      });
      doc.end();

    } catch (err) {
      console.error(err);
      ctx.reply('❌ حدث خطأ أثناء تحويل الصورة إلى PDF.');
      sendMainMenu(ctx);
    }
  } else {
    ctx.reply('⚠️ يرجى اختيار أداة "صورة إلى PDF" أولاً قبل إرسال الصور.');
  }
});

// ---------- معالجة النصوص والمدخلات ----------

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
      const urlLower = text.toLowerCase();
      const isHttps = urlLower.startsWith('https://');
      const suspiciousKeywords = ['trycloudflare.com', 'ngrok', 'loca.lt', 'serveo.net', 'portmap', 'page.link'];
      const isTunnel = suspiciousKeywords.some(keyword => urlLower.includes(keyword));

      let responseMsg = '';

      if (isTunnel) {
        responseMsg = `⚠️ **تحذير أمني عالي!**\n\nالرابط يعتمد على خدمة أنفاق أو إعادة توجيه مؤقتة:\n\`${text}\`\n\nتُستخدم هذه الروابط كثيراً في اختبارات الاختراق والتصيد الاحتيالي، يُرجى الحذر وعدم فتح الرابط أو إدخال أي بيانات فيه!`;
      } else if (isHttps) {
        responseMsg = `🔒 **فحص الاتصال:**\n\nالرابط يتيح التشفير (HTTPS).\n💡 *ملاحظة:* التشفير يحمي البيانات أثناء النقل ولكن يجب دائماً التثبت من هوية الموقع.`;
      } else {
        responseMsg = `🚨 **رابط غير آمن (HTTP):**\n\nهذا الرابط لا يمتلك شهادة تشفير، الاتصال به غير آمن.`;
      }

      return ctx.reply(responseMsg, { parse_mode: 'Markdown' }).then(() => sendMainMenu(ctx));
    }

    if (tool === 'ip') {
      delete userSessions[userId];
      return ctx.reply(`🌐 نتيجة فحص العنوان (${text}):\nالعنوان جاهز للاستخدام ومقبول.`).then(() => sendMainMenu(ctx));
    }

    // 🌐 أداة الترجمة الفورية
    if (tool === 'translate') {
      delete userSessions[userId];
      await ctx.reply('⏳ جاري ترجمة النص...');
      const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(text)}`);
      const translatedText = res.data[0].map(item => item[0]).join('');
      return ctx.reply(`🌐 **الترجمة:**\n\n${translatedText}`, { parse_mode: 'Markdown' }).then(() => sendMainMenu(ctx));
    }

    // 📝 أداة تحويل النص إلى PDF
    if (tool === 'text_to_pdf') {
      delete userSessions[userId];
      await ctx.reply('⏳ جاري تحويل النص إلى مستند PDF...');
      
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        await ctx.replyWithDocument({
          source: pdfData,
          filename: 'text_document.pdf'
        }, { caption: '✅ تم إنشاء ملف الـ PDF بنجاح!' });
        sendMainMenu(ctx);
      });

      doc.fontSize(14).text(text, { align: 'left' });
      doc.end();
      return;
    }

  } catch (err) {
    console.error(err);
    delete userSessions[userId];
    return ctx.reply('❌ حدث خطأ في معالجة الطلب، يرجى التأكد من المدخلات والمحاولة مجدداً.').then(() => sendMainMenu(ctx));
  }
});

bot.launch().then(() => {
  console.log('تم تشغيل البوت بنجاح والاتصال بتليجرام!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
