/**
 * Decap CMS widget: compact Blog SEO & Content Assistant.
 *
 * Uses window.BlogQuality (generated from src/lib/seo/blog-quality.ts).
 * UI copy is always Persian (RTL) for every article locale.
 * UI state is never written to frontmatter (preSave strips qualityAssistant).
 */
(function () {
  var CMS = window.CMS;
  var h = window.h || (window.React && window.React.createElement.bind(window.React));
  var createClass = window.createClass;
  if (!CMS || !h || !createClass) {
    console.error("[blog-quality] Decap globals missing; widget not registered.");
    return;
  }

  var catalog = [];
  fetch("/admin/internal-paths.json")
    .then(function (response) {
      return response.ok ? response.json() : { paths: [] };
    })
    .then(function (data) {
      catalog = Array.isArray(data.paths) ? data.paths : [];
    })
    .catch(function () {
      catalog = [];
    });

  var FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  function faNum(value) {
    return String(value).replace(/\d/g, function (digit) {
      return FA_DIGITS[Number(digit)];
    });
  }

  var UI = {
    title: "دستیار سئو و محتوا",
    scoreTitle: "امتیاز سئو و محتوا",
    scoreHint: "امتیاز تحریریه‌ای است، امتیاز رتبه‌بندی گوگل نیست.",
    loading: "دستیار در حال بارگذاری است…",
    keyword: "کلمه کلیدی اصلی",
    keywordHint: "عبارتی که خریدار واقعاً جستجو می‌کند. اگر خالی بماند، جایگذاری بررسی نمی‌شود.",
    keywordMissing: "کلمه کلیدی اصلی مشخص نشده است.",
    keywordPlaceholder: "مثلاً مشخصات پای مرغ منجمد",
    relatedTerms: "عبارات مرتبط قابل تشخیص",
    intent: "نیت جستجو",
    categories: {
      seo: "سئو",
      content: "محتوا",
      keywords: "کلمات کلیدی",
      links: "پیوندها",
      structure: "ساختار",
    },
    intentType: {
      informational: "اطلاعاتی",
      commercial: "تجاری",
      transactional: "تراکنشی",
      navigational: "ناوبری",
      unclear: "نامشخص",
    },
    status: {
      required: "مهم",
      attention: "نیاز به بهبود",
      good: "مناسب",
    },
    statusIcon: {
      required: "🔴",
      attention: "🟠",
      good: "🟢",
    },
    problem: "مشکل",
    why: "چرا مهم است؟",
    how: "پیشنهاد",
    requiredSection: "مهم",
    attentionSection: "نیاز به بهبود",
    passingSection: "مناسب",
    recs: "پیشنهادهای اصلی",
    recsEmpty: "مورد فوری برای اصلاح نیست.",
    actions: "مهم‌ترین اقدامات قبل از انتشار",
    suggestions: "صفحات موجود پیشنهادی",
    suggestionsHint: "فقط مسیرهایی که روی همین سایت هستند. مسیر ساختگی ننویسید.",
    metrics: {
      words: "تعداد واژه",
      title: "عنوان",
      seoTitle: "عنوان سئو",
      meta: "توضیح متا",
      headings: "سرتیترها",
      links: "پیوند داخلی",
      density: "تراکم عبارت",
    },
    range: "محدوده پیشنهادی",
    chars: "نویسه",
    placement: {
      title: "عنوان / H1",
      seoTitle: "عنوان سئو",
      meta: "توضیح متا",
      intro: "مقدمه",
      body: "متن",
      headings: "سرتیترها",
      slug: "اسلاگ",
    },
    present: "هست",
    absent: "نیست",
    disclaimer:
      "این پنل یک راهنمای تحریریه‌ای برای نوشتن مردم‌محور است. امتیاز رتبه‌بندی گوگل نیست و دیده شدن در جستجو، AI Overviews یا AI Mode را تضمین نمی‌کند. تعداد واژه و تراکم کلمه کلیدی فقط اطلاع‌رسانی است.",
  };

  var ISSUE = {
    req_title: {
      label: "عنوان مقاله خالی است",
      why: "عنوان، تنها H1 صفحه و پیش‌فرض عنوان جستجو است.",
      how: "یک عنوان مشخص بنویسید که خریدار آن را بشناسد. بدنه را با # شروع نکنید.",
    },
    req_excerpt: {
      label: "خلاصه مقاله خالی است",
      why: "خلاصه، متن کارت فهرست و جایگزین توضیح متا است.",
      how: "یک یا دو جمله بنویسید که بگوید خواننده بعد از مقاله چه کاری می‌تواند بکند.",
    },
    req_image: {
      label: "تصویر شاخص وجود ندارد",
      why: "مقاله منتشرشده به یک عکس واقعی برای صفحه، فهرست و تصویر اجتماعی نیاز دارد.",
      how: "یک عکس عریض از کتابخانه رسانه بارگذاری کنید. صحنه ساختگی نسازید.",
    },
    req_image_alt: {
      label: "متن جایگزین تصویر شاخص خالی است",
      why: "متن جایگزین تصویر را برای کسانی توصیف می‌کند که آن را نمی‌بینند.",
      how: "فقط آنچه در تصویر دیده می‌شود را به زبان مقاله بنویسید.",
    },
    req_slug: {
      label: "اسلاگ نامعتبر است",
      why: "اسلاگ بخش پایدار انگلیسی نشانی است و بین زبان‌ها مشترک می‌ماند.",
      how: "فقط حروف کوچک انگلیسی، عدد و خط تیره به کار ببرید.",
    },
    req_date: {
      label: "تاریخ انتشار نامعتبر است",
      why: "datePublished و lastmod نقشه سایت از این فیلد می‌آید.",
      how: "یک تاریخ تقویمی واقعی انتخاب کنید.",
    },
    req_updated: {
      label: "تاریخ بازنگری نامعتبر است",
      why: "اگر تاریخ بازنگری باشد، باید همان روز یا بعد از انتشار باشد.",
      how: "فقط وقتی مقاله واقعاً عوض شده تاریخ بازنگری بگذارید.",
    },
    req_canonical: {
      label: "نشانی canonical نامعتبر است",
      why: "override کنونیکال باید یک نشانی مطلق https باشد.",
      how: "خالی بگذارید مگر مقاله رونوشت منتشرشده در جای دیگری باشد.",
    },
    req_related: {
      label: "مسیر داخلی ناشناخته در صفحات مرتبط",
      why: "مسیر ناشناخته ساخت تولید را متوقف می‌کند. سایت نشانی ساختگی نمی‌سازد.",
      how: "فقط مسیرهای موجود مثل /products/frozen-chicken-feet را وارد کنید.",
    },
    req_seo_title_len: {
      label: "عنوان سئو طولانی‌تر از ۶۰ نویسه است",
      why: "عنوان طولانی‌تر از ۶۰ نویسه در نتایج کوتاه می‌شود و ساخت را رد می‌کند.",
      how: "عنوان سئو را کوتاه کنید یا خالی بگذارید تا عنوان مقاله استفاده شود.",
    },
    req_seo_desc_len: {
      label: "توضیح متا طولانی‌تر از ۱۶۰ نویسه است",
      why: "توضیح طولانی‌تر از ۱۶۰ نویسه ساخت را رد می‌کند.",
      how: "توضیح را کوتاه کنید یا خالی بگذارید تا خلاصه استفاده شود.",
    },
    req_no_h1: {
      label: "در بدنه یک H1 اضافه وجود دارد",
      why: "فیلد عنوان تنها H1 صفحه است. علامت # در بدنه آن را تکرار می‌کند.",
      how: "بخش‌ها را با Heading 2 و بعد Heading 3 شروع کنید.",
    },
    search_title: {
      label: "کیفیت و وضوح عنوان",
      why: "عنوان باید خلاصه مشخص مقاله باشد، نه تیتر هیجانی.",
      how: "عنوان را مثل جمله یک گزارش کاری بنویسید.",
    },
    search_intent: {
      label: "نیت جستجو در عنوان مشخص نیست",
      why: "عنوان خیلی کلی است و کار مشخص خریدار را نام نمی‌برد.",
      how: "تصمیم یا بررسی را نام ببرید؛ مثلاً مقایسه IQF با بلوک‌منجمد.",
    },
    search_meta: {
      label: "کیفیت توضیح متا",
      why: "خواننده باید از اسنیپت بفهمد مقاله چه چیزی را پوشش می‌دهد.",
      how: "یک جمله کامل ۷۰ تا ۱۶۰ نویسه‌ای بنویسید یا فیلد را خالی بگذارید.",
    },
    search_title_match: {
      label: "عنوان سئو با مقاله هم‌خوان نیست",
      why: "عنوان سئو می‌تواند با H1 فرق کند، اما باید همین مقاله را توصیف کند.",
      how: "برای موضوع دیگری عنوان جستجو ننویسید.",
    },
    structure_headings: {
      label: "سلسله‌مراتب سرتیترها",
      why: "سرتیترها صفحه را قابل اسکن می‌کنند و طرح کلی را روشن می‌کنند.",
      how: "با Heading 2 شروع کنید و Heading 3 را زیر آن بگذارید.",
    },
    structure_intro: {
      label: "مقدمه موضوع را تثبیت نمی‌کند",
      why: "پاراگراف اول باید همان موضوع عنوان را نشان بدهد.",
      how: "در جمله اول بگویید مقاله برای کیست و چه چیزی را بررسی می‌کند.",
    },
    structure_delivers: {
      label: "بدنه به وعده عنوان عمل نمی‌کند",
      why: "عنوان موضوعی را وعده می‌دهد که متن تقریباً به آن نمی‌پردازد.",
      how: "عنوان را با متن هماهنگ کنید یا بررسی‌های وعده‌داده‌شده را اضافه کنید.",
    },
    structure_conclusion: {
      label: "گام بعدی در پایان نیست",
      why: "مقاله بدون اینکه بگوید با این اطلاعات چه کار کنند تمام می‌شود.",
      how: "با یک اقدام مشخص ببندید: درخواست مشخصات، پروتکل نمونه، یا فرم تماس.",
    },
    structure_readability: {
      label: "جمله‌ها برای موبایل طولانی است",
      why: "چند جمله خیلی طولانی روی گوشی سخت خوانده می‌شود. این نمره سطح خوانایی گوگل نیست.",
      how: "جمله‌های بلند را بشکنید. گوگل تعداد واژه اجباری ندارد.",
    },
    structure_repetition: {
      label: "تکرار بیش از حد عبارت",
      why: "یک عبارت چندکلمه‌ای چند بار پشت سر هم تکرار شده است.",
      how: "یک بار بگویید و جلو بروید. برای تراکم کلمه کلیدی تکرار نکنید.",
    },
    people_useful: {
      label: "محتوا برای مخاطب هدف هنوز نازک است",
      why: "بدنه آن‌قدر توضیح ساخت‌یافته ندارد که خریدار راضی شود.",
      how: "همان بررسی‌هایی را بنویسید که در تماس واقعی مطرح می‌کنید.",
    },
    people_expertise: {
      label: "نشانه تجربه عملی کم است",
      why: "متن نشان نمی‌دهد نویسنده با محصول، مدارک یا زنجیره سرد کار کرده است.",
      how: "یک جزئیات واقعی از کار صادرات اضافه کنید. نویسنده فردی نسازید.",
    },
    people_original: {
      label: "تحلیل یا اطلاعات اصیل کم است",
      why: "متن بیشتر بازنویسی توصیه‌های عمومی به نظر می‌رسد.",
      how: "یک مثال کاری، چک‌لیست خریدار یا تمایزی که واقعاً به کار می‌برید اضافه کنید.",
    },
    people_beyond: {
      label: "فراتر از خلاصه عمومی نرفته است",
      why: "هنوز شبیه خلاصه کالایی است، نه یک بریفینگ میز صادرات.",
      how: "تصمیم واردکننده را نام ببرید. برای طولانی شدن متن اضافه نکنید.",
    },
    people_intent: {
      label: "پاسخ نیت خواننده روشن نیست",
      why: "مشخص نیست جستجوگر با چه سؤالی از صفحه خارج می‌شود.",
      how: "سؤال را در عنوان یا اولین سرتیتر بگویید و بعد جواب بدهید.",
    },
    people_satisfied: {
      label: "خواننده ممکن است دوباره جستجو کند",
      why: "ممکن است خواننده بدون اقدام بعدی یا مجموعه کامل بررسی‌ها برود.",
      how: "بپرسید آیا کسی بعد از خواندن می‌تواند کارش را انجام دهد.",
    },
    people_claims: {
      label: "ادعا بدون منبع یا قید «استعلام»",
      why: "گواهی، قیمت یا تضمین بدون «بپرسید / بررسی کنید / درخواست کنید» آمده است.",
      how: "شماره گواهی، قیمت یا نام مشتری نسازید. به /certifications پیوند بدهید.",
    },
    people_trust: {
      label: "مرجع مقاله روشن نیست",
      why: "خواننده نمی‌بیند چه سازمانی پشت متن ایستاده است.",
      how: "نام تیم را نگه دارید و به /about یا /quality-control پیوند بدهید.",
    },
    people_filler: {
      label: "عبارت پرکننده یا لحن عمومی هوش مصنوعی",
      why: "عبارت‌های قالبی متن را شتاب‌زده نشان می‌دهند.",
      how: "جمله‌های کلی را حذف کنید. گوگل ابزار پیش‌نویس را جریمه نمی‌کند؛ شتاب‌زدگی را می‌بیند.",
    },
    vis_crawlable: {
      label: "متن قابل نمایه‌سازی کم است",
      why: "تقریباً متنی برای ایندکس نیست. تصویر به‌تنهایی مقاله نیست.",
      how: "توضیح را به صورت پاراگراف و فهرست بنویسید. فایل llms.txt لازم نیست.",
    },
    vis_headings: {
      label: "سرتیتر واضح کم است",
      why: "سرتیتر به اسکن انسان و نقل قول دقیق کمک می‌کند؛ «چانک برای هوش مصنوعی» نیست.",
      how: "برای هر سؤال یا بررسی واقعی یک Heading 2 بگذارید.",
    },
    vis_answers: {
      label: "پاسخ کوتاه در ابتدا نیست",
      why: "بهتر است اول جواب مستقیم بیاید و بعد گسترش پیدا کند.",
      how: "برای AI Overviews شیوه نوشتن جداگانه‌ای لازم نیست. برای واردکننده بنویسید.",
    },
    vis_context: {
      label: "زمینه موضوع ناقص است",
      why: "دسته، برچسب و پیوند به محصول یا بازار می‌گوید مقاله درباره چیست.",
      how: "یک دسته انتخاب کنید و به محصول یا بازاری که واقعاً موضوع مقاله است پیوند بدهید.",
    },
    vis_internal: {
      label: "پیوند داخلی وجود ندارد",
      why: "مقاله هنوز به صفحه دیگری از همین سایت اشاره نمی‌کند.",
      how: "به مسیرهای موجود مثل /products/frozen-chicken-feet یا /quality-control پیوند بدهید.",
    },
    vis_images: {
      label: "تصویر توصیفی کامل نیست",
      why: "عکس واقعی با متن جایگزین به خواننده کمک می‌کند.",
      how: "عکس واقعی بگذارید و متن جایگزین را با آنچه دیده می‌شود هماهنگ کنید.",
    },
    vis_schema: {
      label: "داده ساخت‌یافته با محتوای مرئی کامل نیست",
      why: "BlogPosting از عنوان، خلاصه، تصویر، تاریخ و نام تیم ساخته می‌شود.",
      how: "این فیلدها را درست نگه دارید. اسکیمای FAQ اضافه نکنید اگر در صفحه نیست.",
    },
    vis_entity: {
      label: "رابطه موضوع با صفحات موجود روشن نیست",
      why: "پیوند به محصول یا بازار واقعی می‌گوید مقاله درباره کدام موجودیت است.",
      how: "یک مسیر مرتبط یا پیوند درون‌متنی به صفحه موجود اضافه کنید.",
    },
    vis_unique: {
      label: "تمایز مفید هنوز کم است",
      why: "دیده شدن از صفحه غیرکالایی و مردم‌محور می‌آید، نه از ترفند GEO/AEO.",
      how: "یک تمایز واقعی از کار صادرات اضافه کنید.",
    },
    kw_present: {
      label: "کلمه کلیدی اصلی مشخص نشده است",
      why: "بدون عبارت هدف، جایگذاری و تکرار قابل بررسی نیست. گوگل آن را اجباری نمی‌داند.",
      how: "در فیلد کلمه کلیدی اصلی، عبارتی را بنویسید که خریدار واقعاً جستجو می‌کند.",
    },
    kw_focus: {
      label: "کلمه کلیدی در عنوان یا مقدمه نیامده است",
      why: "عبارت هدف در عنوان، خلاصه یا پاراگراف اول دیده نمی‌شود.",
      how: "ایده را یک بار، به زبان طبیعی، همان‌جا که خواننده انتظار دارد بگویید.",
    },
    kw_stuffing: {
      label: "خطر تکرار مصنوعی کلمه کلیدی",
      why: "تکرار عین عبارت شبیه بهینه‌سازی برای موتور است، نه برای خواننده.",
      how: "ذکرهای طبیعی را نگه دارید و اضافه‌ها را حذف کنید. تراکم اجباری وجود ندارد.",
    },
    kw_placement: {
      label: "جایگذاری کلمه کلیدی ضعیف است",
      why: "عبارت اصلی در عنوان و پاراگراف اول نیست.",
      how: "موضوع را یک بار در H1 یا مقدمه نام ببرید. در هر سرتیتر تکرار نکنید.",
    },
    link_internal: {
      label: "پیوند داخلی ناقص یا مسیر ناشناخته",
      why: "مسیر ساختگی ساخت را متوقف می‌کند و مسیر خالی خواننده را راهنمایی نمی‌کند.",
      how: "از مسیرهای موجود استفاده کنید. دو تا پنج صفحه مرتبط پیشنهاد تحریریه‌ای است، قاعده گوگل نیست.",
    },
    link_external: {
      label: "منبع خارجی در جای لازم نیست",
      why: "بحث مقررات یا منبع رسمی بدون پیوند قابل‌بازکردن آمده است.",
      how: "به صفحه رسمی واقعی پیوند بدهید یا بگویید مجموعه مدارک جاری را درخواست کنند.",
    },
    link_count: {
      label: "تعداد پیوند داخلی خارج از محدوده پیشنهادی است",
      why: "صفر پیوند خواننده را نگه نمی‌دارد و فهرست خیلی بلند شبیه فهرست لینک می‌شود.",
      how: "دو تا پنج مسیر موجود کافی است. این پیشنهاد تحریریه‌ای است، نه قاعده گوگل.",
    },
    img_featured: {
      label: "تصویر شاخص یا متن جایگزین ضعیف است",
      why: "عکس بدون توصیف، یا متن جایگزین پر از کلمه کلیدی، به خواننده کمک نمی‌کند.",
      how: "صحنه دیده‌شده را توصیف کنید. کلمه کلیدی را در alt تکرار نکنید.",
    },
    img_body: {
      label: "تصویر داخل مقاله متن جایگزین ندارد",
      why: "تصویر بدون alt برای خواننده بدون تصویر بی‌معنا است.",
      how: "در گفتگوی تصویر مارک‌داون، فیلد alt را با آنچه دیده می‌شود پر کنید.",
    },
    img_og: {
      label: "تصویر اجتماعی بدون متن جایگزین است",
      why: "تصویر اختصاصی شبکه اجتماعی بدون alt خودش تنظیم شده است.",
      how: "اگر برش ۱۲۰۰×۶۳۰ می‌گذارید alt جدا بنویسید؛ وگرنه فیلد را خالی بگذارید.",
    },
    content_depth: {
      label: "عمق محتوا خارج از محدوده پیشنهادی است",
      why: "بدنه هنوز برای یک بریفینگ خریدار نازک — یا بیش از حد طولانی — است. این قاعده رتبه‌بندی نیست.",
      how: "بررسی‌هایی را بنویسید که در تماس واقعی می‌گویید. برای رسیدن به عدد واژه متن نسازید.",
    },
    intent_align: {
      label: "نیت جستجو با متن هم‌خوان نیست",
      why: "عنوان یک کار را وعده می‌دهد و بدنه کار دیگری می‌کند.",
      how: "کاری که خواننده آمده انجام دهد را نام ببرید و قبل از گسترش جواب بدهید.",
    },
  };

  var TONE = {
    required: { fg: "#9b1c1c", bg: "#fde8e8", bar: "#dc2626" },
    attention: { fg: "#92400e", bg: "#fef3c7", bar: "#d97706" },
    good: { fg: "#0f5c4c", bg: "#d1fae5", bar: "#0f766e" },
  };

  function localeFromProps(props) {
    var name = "";
    if (props && props.collection && typeof props.collection.get === "function") {
      name = String(props.collection.get("name") || "");
    }
    var match = name.match(/_(en|fa|ru|vi)$/);
    return match ? match[1] : "en";
  }

  function readString(data, key) {
    if (!data || typeof data.get !== "function") return "";
    var value = data.get(key);
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    if (typeof value.toISOString === "function") {
      try {
        return value.toISOString().slice(0, 10);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  function readList(data, key) {
    if (!data || typeof data.get !== "function") return [];
    var value = data.get(key);
    if (!value) return [];
    var items = typeof value.toJS === "function" ? value.toJS() : value;
    if (!Array.isArray(items)) return [];
    return items
      .map(function (item) {
        return String(item == null ? "" : item).trim();
      })
      .filter(Boolean);
  }

  function widgetKeyword(props, state) {
    var data = props && props.entry && typeof props.entry.get === "function" ? props.entry.get("data") : null;
    var fromField = readString(data, "focusKeyphrase");
    if (fromField) return fromField;
    if (state && typeof state.keywordDraft === "string" && state.keywordDraft.trim()) return state.keywordDraft;
    if (props && typeof props.value === "string") return props.value;
    return "";
  }

  function analysisSignature(entry, locale, keyword, catalogSize) {
    var input = inputFromEntry(entry, locale, keyword);
    return JSON.stringify(input) + "|" + String(catalogSize || 0);
  }

  function emptyReport() {
    return {
      checks: [],
      blockers: [],
      suggestions: [],
      wordCount: 0,
      score: 0,
      categories: [],
      metrics: {},
      keyword: { present: false },
      intent: { type: "unclear", aligned: true },
      topActions: [],
      disclaimer: UI.loading,
    };
  }

  function inputFromEntry(entry, locale, keyword) {
    var data = entry && typeof entry.get === "function" ? entry.get("data") : null;
    return {
      title: readString(data, "title"),
      slug: readString(data, "slug"),
      excerpt: readString(data, "excerpt"),
      author: readString(data, "author"),
      date: readString(data, "date"),
      updated: readString(data, "updated"),
      image: readString(data, "image"),
      imageAlt: readString(data, "imageAlt"),
      imageCaption: readString(data, "imageCaption"),
      category: readString(data, "category"),
      tags: readList(data, "tags"),
      focusKeyphrase: keyword || readString(data, "focusKeyphrase"),
      seoTitle: readString(data, "seoTitle"),
      seoDescription: readString(data, "seoDescription"),
      canonicalUrl: readString(data, "canonicalUrl"),
      ogTitle: readString(data, "ogTitle"),
      ogDescription: readString(data, "ogDescription"),
      ogImage: readString(data, "ogImage"),
      ogImageAlt: readString(data, "ogImageAlt"),
      related: readList(data, "related"),
      body: readString(data, "body"),
      locale: locale,
    };
  }

  function syncFocusKeyphraseField(value) {
    if (typeof document === "undefined") return;
    var inputs = document.querySelectorAll("input[type='text'], input:not([type]), input[type='search']");
    for (var i = 0; i < inputs.length; i += 1) {
      var el = inputs[i];
      var id = String(el.id || "");
      var name = String(el.getAttribute("name") || "");
      if (id.indexOf("focusKeyphrase") === -1 && name.indexOf("focusKeyphrase") === -1) continue;
      if (el.value === value) return;
      var proto = window.HTMLInputElement && window.HTMLInputElement.prototype;
      var desc = proto && Object.getOwnPropertyDescriptor(proto, "value");
      if (desc && desc.set) desc.set.call(el, value);
      else el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
  }

  function issueCopy(item) {
    var pack = ISSUE[item.id] || {};
    return {
      label: pack.label || item.label,
      why: pack.why || item.why,
      how: pack.how || item.how,
    };
  }

  function overallStatus(report) {
    if (report.blockers && report.blockers.length) return "required";
    var score = typeof report.score === "number" ? report.score : 0;
    if (score >= 80) return "good";
    return "attention";
  }

  function ringColor(status) {
    if (status === "required") return "#dc2626";
    if (status === "attention") return "#d97706";
    return "#0f766e";
  }

  function scoreRing(score, status) {
    var radius = 38;
    var circ = 2 * Math.PI * radius;
    var safe = Math.max(0, Math.min(100, Number(score) || 0));
    var offset = circ * (1 - safe / 100);
    var color = ringColor(status);
    return h(
      "svg",
      {
        width: "96",
        height: "96",
        viewBox: "0 0 96 96",
        role: "img",
        "aria-label": UI.scoreTitle + " " + faNum(safe) + " از ۱۰۰",
        style: { display: "block" },
      },
      h("circle", {
        cx: "48",
        cy: "48",
        r: String(radius),
        fill: "none",
        stroke: "#e2e8f0",
        strokeWidth: "8",
      }),
      h("circle", {
        cx: "48",
        cy: "48",
        r: String(radius),
        fill: "none",
        stroke: color,
        strokeWidth: "8",
        strokeLinecap: "round",
        strokeDasharray: String(circ),
        strokeDashoffset: String(offset),
        transform: "rotate(-90 48 48)",
        style: { transition: "stroke-dashoffset 0.45s ease, stroke 0.3s ease" },
      }),
      h(
        "text",
        {
          x: "48",
          y: "46",
          textAnchor: "middle",
          fill: "#0a1628",
          style: { fontSize: "22px", fontWeight: 800, fontFamily: "inherit" },
        },
        faNum(safe),
      ),
      h(
        "text",
        {
          x: "48",
          y: "64",
          textAnchor: "middle",
          fill: "#64748b",
          style: { fontSize: "11px", fontWeight: 600, fontFamily: "inherit" },
        },
        "/ ۱۰۰",
      ),
    );
  }

  function categoryRow(item) {
    var tone = TONE[item.status] || TONE.good;
    return h(
      "div",
      { key: item.id, style: { display: "grid", gap: "4px" } },
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "#334155",
          },
        },
        h("span", { style: { fontWeight: 600 } }, UI.categories[item.id] || item.id),
        h("span", { style: { color: tone.fg, fontWeight: 700 } }, faNum(item.score)),
      ),
      h(
        "div",
        {
          style: {
            height: "6px",
            borderRadius: "999px",
            background: "#e2e8f0",
            overflow: "hidden",
          },
        },
        h("div", {
          style: {
            width: Math.max(0, Math.min(100, item.score)) + "%",
            height: "100%",
            background: tone.bar,
            transition: "width 0.35s ease",
          },
        }),
      ),
    );
  }

  function metricCard(label, value, hint) {
    return h(
      "div",
      {
        style: {
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "8px 10px",
          minWidth: 0,
        },
      },
      h("div", { style: { fontSize: "11px", color: "#64748b", marginBottom: "2px" } }, label),
      h("div", { style: { fontSize: "15px", fontWeight: 800, color: "#0a1628" } }, value),
      hint
        ? h("div", { style: { fontSize: "10px", color: "#94a3b8", marginTop: "2px" } }, hint)
        : null,
    );
  }

  function placementChip(label, ok) {
    return h(
      "span",
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 600,
          background: ok ? "#d1fae5" : "#f1f5f9",
          color: ok ? "#0f5c4c" : "#64748b",
          border: "1px solid " + (ok ? "#a7f3d0" : "#e2e8f0"),
        },
      },
      label + " · " + (ok ? UI.present : UI.absent),
    );
  }

  function issueCard(item, openHow, onToggle) {
    var copy = issueCopy(item);
    var tone = TONE[item.status] || TONE.good;
    var expanded = Object.prototype.hasOwnProperty.call(openHow, item.id)
      ? Boolean(openHow[item.id])
      : item.status !== "good";
    return h(
      "article",
      {
        key: item.id,
        style: {
          border: "1px solid #e2e8f0",
          borderInlineStart: "3px solid " + tone.fg,
          borderRadius: "10px",
          padding: "8px 10px",
          marginBlockEnd: "6px",
          background: item.status === "good" ? "#fff" : tone.bg,
        },
      },
      h(
        "button",
        {
          type: "button",
          "aria-expanded": expanded ? "true" : "false",
          onClick: function (event) {
            event.preventDefault();
            onToggle(item.id);
          },
          style: {
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            padding: 0,
            border: 0,
            background: "none",
            cursor: "pointer",
            textAlign: "start",
            color: "#0a1628",
          },
        },
        h(
          "span",
          { style: { fontSize: "13px", fontWeight: 700 } },
          (item.status === "good" ? "" : UI.problem + ": ") + copy.label,
        ),
        h(
          "span",
          { style: { fontSize: "11px", fontWeight: 700, color: tone.fg, flexShrink: 0 } },
          UI.statusIcon[item.status] + " " + UI.status[item.status],
        ),
      ),
      expanded && item.status !== "good"
        ? h(
            "div",
            { style: { marginTop: "6px", fontSize: "12px", lineHeight: 1.55, color: "#334155" } },
            h("p", { style: { margin: "0 0 4px" } }, h("strong", null, UI.why + " "), copy.why),
            h("p", { style: { margin: 0 } }, h("strong", null, UI.how + " "), copy.how),
          )
        : null,
    );
  }

  function section(id, title, count, open, onToggle, children) {
    return h(
      "section",
      { key: id, style: { marginBlockStart: "12px" } },
      h(
        "button",
        {
          type: "button",
          "aria-expanded": open ? "true" : "false",
          onClick: function (event) {
            event.preventDefault();
            onToggle();
          },
          style: {
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            padding: "6px 0",
            border: 0,
            background: "none",
            cursor: "pointer",
            color: "#0a1628",
            fontSize: "12px",
            fontWeight: 800,
            textAlign: "start",
          },
        },
        h("span", null, title + " (" + faNum(count) + ")"),
        h("span", { "aria-hidden": "true" }, open ? "▾" : "◂"),
      ),
      open ? children : null,
    );
  }

  function renderReport(report, locale, ui, handlers, keywordValue) {
    var status = overallStatus(report);
    var tone = TONE[status] || TONE.good;
    var metrics = report.metrics || {};
    var keyword = report.keyword || {};
    var intent = report.intent || { type: "unclear", aligned: true, reason: "" };
    var required = (report.checks || []).filter(function (item) {
      return item.status === "required";
    });
    var attention = (report.checks || []).filter(function (item) {
      return item.status === "attention";
    });
    var passing = (report.checks || []).filter(function (item) {
      return item.status === "good";
    });
    var recs = report.topActions && report.topActions.length ? report.topActions : required.concat(attention).slice(0, 5);
    var wordHint =
      UI.range + " " + faNum(metrics.recommendedWordMin || 500) + "–" + faNum(metrics.recommendedWordMax || 1800);
    var displayTitleChars = metrics.seoTitleChars || metrics.titleChars || 0;
    var metaChars = metrics.metaChars || 0;

    return h(
      "div",
      {
        dir: "rtl",
        lang: "fa",
        role: "region",
        "aria-label": UI.title,
        style: {
          fontFamily: '"Vazirmatn Variable", Vazirmatn, Tahoma, ui-sans-serif, sans-serif',
          color: "#0a1628",
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid #cbd5e1",
          borderRadius: "16px",
          padding: "14px 14px 12px",
        },
      },
      h(
        "style",
        null,
        '@font-face{font-family:"Vazirmatn Variable";src:url("/fonts/Vazirmatn-Variable.woff2") format("woff2");font-weight:100 900;font-display:swap;}',
      ),
      h(
        "header",
        {
          style: {
            display: "flex",
            gap: "14px",
            alignItems: "center",
            marginBlockEnd: "12px",
          },
        },
        scoreRing(report.score || 0, status),
        h(
          "div",
          { style: { minWidth: 0, flex: 1 } },
          h("h2", { style: { margin: 0, fontSize: "16px", fontWeight: 800 } }, UI.title),
          h(
            "p",
            {
              style: { margin: "4px 0 0", fontSize: "13px", fontWeight: 800, color: tone.fg },
            },
            UI.scoreTitle,
          ),
          h(
            "p",
            {
              role: "status",
              "aria-live": "polite",
              style: { margin: "4px 0 0", fontSize: "13px", fontWeight: 700, color: tone.fg },
            },
            UI.statusIcon[status] + " " + UI.status[status] + " · " + faNum(report.score || 0) + " از ۱۰۰",
          ),
          h(
            "p",
            { style: { margin: "4px 0 0", fontSize: "11px", color: "#64748b", lineHeight: 1.45 } },
            UI.scoreHint,
          ),
        ),
      ),
      h(
        "div",
        { style: { display: "grid", gap: "8px", marginBlockEnd: "12px" } },
        (report.categories || []).map(categoryRow),
      ),
      h(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "8px",
            marginBlockEnd: "12px",
          },
        },
        metricCard(UI.metrics.words, faNum(metrics.wordCount || report.wordCount || 0), wordHint),
        metricCard(
          UI.metrics.title,
          faNum(metrics.titleChars || 0) + " " + UI.chars,
          "عنوان سئو " + faNum(displayTitleChars),
        ),
        metricCard(UI.metrics.meta, faNum(metaChars) + " " + UI.chars, "۷۰–۱۶۰ " + UI.chars),
        metricCard(
          UI.metrics.headings,
          "H2 " + faNum(metrics.h2Count || 0) + " · H3 " + faNum(metrics.h3Count || 0),
          metrics.bodyH1Count ? "بدنه H1 دارد" : "بدون H1 در بدنه",
        ),
        metricCard(
          UI.metrics.links,
          faNum((metrics.internalLinks || 0) + (metrics.relatedCount || 0)),
          "پیشنهاد تحریریه: ۲ تا ۵",
        ),
        metricCard(UI.metrics.density, faNum(metrics.keywordDensityPercent || 0) + "٪", "فقط اطلاع‌رسانی"),
      ),
      h(
        "section",
        {
          style: {
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "10px 12px",
            marginBlockEnd: "12px",
          },
        },
        h("label", { htmlFor: "bq-keyword", style: { display: "block", fontSize: "13px", fontWeight: 800 } }, UI.keyword),
        h("p", { style: { margin: "4px 0 8px", fontSize: "11px", color: "#64748b", lineHeight: 1.45 } }, UI.keywordHint),
        h("input", {
          id: "bq-keyword",
          type: "text",
          value: keywordValue,
          placeholder: UI.keywordPlaceholder,
          onChange: handlers.onKeywordChange,
          style: {
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid " + (keywordValue ? "#cbd5e1" : "#f59e0b"),
            borderRadius: "8px",
            padding: "8px 10px",
            fontSize: "13px",
            fontFamily: "inherit",
            color: "#0a1628",
            background: "#fff",
          },
        }),
        !keywordValue
          ? h(
              "p",
              { style: { margin: "8px 0 0", fontSize: "12px", color: "#92400e", fontWeight: 600 } },
              "🟠 " + UI.keywordMissing,
            )
          : h(
              "div",
              { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" } },
              placementChip(UI.placement.title, Boolean(keyword.inTitle)),
              placementChip(UI.placement.seoTitle, Boolean(keyword.inSeoTitle)),
              placementChip(UI.placement.meta, Boolean(keyword.inMeta)),
              placementChip(UI.placement.intro, Boolean(keyword.inIntro)),
              placementChip(UI.placement.body, Boolean(keyword.inBody)),
              placementChip(UI.placement.headings, Boolean(keyword.inHeadings)),
              placementChip(UI.placement.slug, Boolean(keyword.inSlug)),
            ),
        keyword.relatedTerms && keyword.relatedTerms.length
          ? h(
              "p",
              { style: { margin: "8px 0 0", fontSize: "11px", color: "#475569" } },
              UI.relatedTerms + ": " + keyword.relatedTerms.join(" · "),
            )
          : null,
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
            alignItems: "center",
            background: intent.aligned ? "#ecfdf5" : "#fff7ed",
            border: "1px solid " + (intent.aligned ? "#a7f3d0" : "#fed7aa"),
            borderRadius: "10px",
            padding: "8px 10px",
            marginBlockEnd: "12px",
            fontSize: "12px",
          },
        },
        h(
          "div",
          null,
          h("strong", null, UI.intent + "： "),
          UI.intentType[intent.type] || UI.intentType.unclear,
        ),
        h("span", { style: { color: "#475569" } }, intent.aligned ? "🟢 هم‌خوان" : "🟠 نیاز به بازبینی"),
      ),
      recs.length
        ? h(
            "section",
            {
              style: {
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "10px 12px",
                marginBlockEnd: "8px",
              },
            },
            h("h3", { style: { margin: "0 0 8px", fontSize: "13px", fontWeight: 800 } }, UI.recs),
            recs.map(function (item) {
              return issueCard(item, ui.how, handlers.toggleHow);
            }),
          )
        : h("p", { style: { fontSize: "12px", color: "#0f5c4c", fontWeight: 600 } }, UI.recsEmpty),
      required.length
        ? section(
            "required",
            "🔴 " + UI.requiredSection,
            required.length,
            ui.required !== false,
            handlers.toggleRequired,
            required.map(function (item) {
              return issueCard(item, ui.how, handlers.toggleHow);
            }),
          )
        : null,
      attention.length
        ? section(
            "attention",
            "🟠 " + UI.attentionSection,
            attention.length,
            ui.attention !== false,
            handlers.toggleAttention,
            attention.map(function (item) {
              return issueCard(item, ui.how, handlers.toggleHow);
            }),
          )
        : null,
      passing.length
        ? section(
            "passing",
            "🟢 " + UI.passingSection,
            passing.length,
            Boolean(ui.passing),
            handlers.togglePassing,
            passing.map(function (item) {
              return issueCard(item, ui.how, handlers.toggleHow);
            }),
          )
        : null,
      report.suggestions && report.suggestions.length
        ? section(
            "suggestions",
            UI.suggestions,
            report.suggestions.length,
            ui.suggestions !== false,
            handlers.toggleSuggestions,
            [
              h(
                "p",
                {
                  key: "hint",
                  style: { margin: "0 0 6px", fontSize: "12px", color: "#475569", lineHeight: 1.45 },
                },
                UI.suggestionsHint,
              ),
              h(
                "ul",
                { key: "list", style: { margin: 0, paddingInlineStart: "18px", fontSize: "13px" } },
                report.suggestions.map(function (item) {
                  return h("li", { key: item.path }, item.title + " — " + item.path);
                }),
              ),
            ],
          )
        : null,
      h(
        "footer",
        {
          style: {
            marginBlockStart: "14px",
            padding: "10px 12px",
            background: "#0a1628",
            color: "#e2e8f0",
            borderRadius: "12px",
          },
        },
        h("h3", { style: { margin: "0 0 8px", fontSize: "13px", fontWeight: 800, color: "#fff" } }, UI.actions),
        recs.length
          ? h(
              "ol",
              { style: { margin: 0, paddingInlineStart: "18px", fontSize: "12px", lineHeight: 1.55 } },
              recs.map(function (item) {
                var copy = issueCopy(item);
                return h("li", { key: "act-" + item.id }, copy.label + " — " + copy.how);
              }),
            )
          : h("p", { style: { margin: 0, fontSize: "12px" } }, UI.recsEmpty),
        h(
          "p",
          { style: { margin: "10px 0 0", fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 } },
          UI.disclaimer,
        ),
      ),
    );
  }

  var Control = createClass({
    getInitialState: function () {
      return {
        how: {},
        required: true,
        attention: true,
        passing: false,
        suggestions: true,
        keywordDraft: "",
      };
    },
    // Decap's Widget wrapper skips rerenders unless this field's own value
    // changes. The assistant has no stored value — it reads the rest of the
    // entry — so we must opt in to every parent update or the panel stays
    // frozen on the first empty snapshot.
    shouldComponentUpdate: function () {
      return true;
    },
    componentDidMount: function () {
      this._tick = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        var locale = localeFromProps(this.props);
        var keyword = widgetKeyword(this.props, this.state);
        var sig = analysisSignature(this.props.entry, locale, keyword, catalog.length);
        if (sig === this._appliedSig) return;
        this.forceUpdate();
      }, 400);
    },
    componentWillUnmount: function () {
      if (this._tick) clearInterval(this._tick);
      if (this._debounce) clearTimeout(this._debounce);
    },
    toggleHow: function (id, defaultOpen) {
      var how = {};
      var key;
      for (key in this.state.how) {
        if (Object.prototype.hasOwnProperty.call(this.state.how, key)) how[key] = this.state.how[key];
      }
      var current = Object.prototype.hasOwnProperty.call(this.state.how, id)
        ? this.state.how[id]
        : Boolean(defaultOpen);
      how[id] = !current;
      this.setState({ how: how });
    },
    onKeywordChange: function (event) {
      var value = event.target.value;
      this.setState({ keywordDraft: value });
      if (typeof this.props.onChange === "function") this.props.onChange(value);
      syncFocusKeyphraseField(value);
    },
    render: function () {
      var locale = localeFromProps(this.props);
      var keyword = widgetKeyword(this.props, this.state);
      var api = window.BlogQuality;
      var sig = analysisSignature(this.props.entry, locale, keyword, catalog.length);
      if (api && typeof api.analyzeBlogQuality === "function") {
        if (!this._cachedReport) {
          this._cachedReport = api.analyzeBlogQuality(inputFromEntry(this.props.entry, locale, keyword), {
            catalog: catalog,
          });
          this._appliedSig = sig;
        } else if (sig !== this._appliedSig && sig !== this._pendingSig) {
          this._pendingSig = sig;
          if (this._debounce) clearTimeout(this._debounce);
          this._debounce = setTimeout(() => {
            var nextLocale = localeFromProps(this.props);
            var nextKeyword = widgetKeyword(this.props, this.state);
            this._cachedReport = api.analyzeBlogQuality(
              inputFromEntry(this.props.entry, nextLocale, nextKeyword),
              { catalog: catalog },
            );
            this._appliedSig = analysisSignature(this.props.entry, nextLocale, nextKeyword, catalog.length);
            this._pendingSig = "";
            this.forceUpdate();
          }, 280);
        }
      }
      var report = this._cachedReport || emptyReport();
      return renderReport(
        report,
        locale,
        this.state,
        {
          toggleHow: (id, defaultOpen) => this.toggleHow(id, defaultOpen),
          toggleRequired: () => this.setState({ required: !this.state.required }),
          toggleAttention: () => this.setState({ attention: !this.state.attention }),
          togglePassing: () => this.setState({ passing: !this.state.passing }),
          toggleSuggestions: () => this.setState({ suggestions: !this.state.suggestions }),
          onKeywordChange: (event) => this.onKeywordChange(event),
        },
        keyword,
      );
    },
  });

  CMS.registerWidget("blog-quality", Control);

  ["blog_en", "blog_fa", "blog_ru", "blog_vi"].forEach(function (name) {
    CMS.registerPreviewTemplate(name, Control);
  });

  CMS.registerEventListener({
    name: "preSave",
    handler: function (event) {
      var entry = event.entry;
      if (!entry || typeof entry.deleteIn !== "function") return entry;
      var assistant = typeof entry.getIn === "function" ? entry.getIn(["data", "qualityAssistant"]) : null;
      var existing = typeof entry.getIn === "function" ? entry.getIn(["data", "focusKeyphrase"]) : null;
      var phrase = typeof assistant === "string" ? assistant.trim() : "";
      var have = existing == null ? "" : String(existing).trim();
      if (phrase && !have && typeof entry.setIn === "function") {
        entry = entry.setIn(["data", "focusKeyphrase"], phrase);
      }
      return entry.deleteIn(["data", "qualityAssistant"]);
    },
  });
})();
