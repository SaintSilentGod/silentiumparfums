// Silentium — Perfume Data
// Design: Void Romanticism — each perfume has a unique accent color and emotional radar axes

export interface ScentNotes {
  top?: { ru: string[]; en: string[] };
  heart?: { ru: string[]; en: string[] };
  base?: { ru: string[]; en: string[] };
  all?: { ru: string[]; en: string[] };
}

export interface RadarAxis {
  key: string;
  label: { ru: string; en: string };
  value: number;
}

type L10n = { ru: string; en: string };

// Plain-language guide shown on a perfume page: what it smells like, how it changes on skin,
// how loud it is. Written for someone who has never smelled it.
export interface PerfumeGuide {
  plain: L10n;
  drydown: { when: L10n; text: L10n; notes: "top" | "heart" | "base" }[];
  facets: { label: L10n; value: number }[];
  sillage: L10n;
  season: L10n;
  time: L10n;
  tip?: L10n;
  scenes: { ru: string[]; en: string[] };
}

export interface Perfume {
  id: string;
  name: string;
  emotionalPath: string[];
  scentNotes: ScentNotes;
  radarAxes: RadarAxis[];
  description: { ru: string; en: string };
  tagline: { ru: string; en: string };
  memoryFragments: { ru: string[]; en: string[] };
  origin: { coords: string; location: { ru: string; en: string } };
  releaseDate: string;
  heroImage: string;
  gallery?: string[];  // optional extra images for gallery slider
  accentColor: string;       // primary accent (hex)
  accentColorDim: string;    // rgba dim version for radar/glow
  radarFill: string;         // rgba fill for radar chart
  keywords: { ru: string; en: string };
  guide?: PerfumeGuide;
}

export const perfumes: Perfume[] = [
  {
    id: "seance",
    name: "Seance",
    emotionalPath: ["Isolation", "Ritual", "Silence"],
    scentNotes: {
      top: { ru: ["Горный воздух", "Водные ноты", "Альдегиды", "Бергамот"], en: ["Mountain Air", "Water Notes", "Aldehydes", "Bergamot"] },
      heart: { ru: ["Ладан", "Дымные ноты", "Бальзамические ноты", "Смолы", "Бумага"], en: ["Incense", "Smoky Notes", "Balsamic Notes", "Resins", "Paper"] },
      base: { ru: ["Березовый деготь", "Сандал", "Древесные ноты"], en: ["Birch Tar", "Sandalwood", "Woody Notes"] },
    },
    radarAxes: [
      { key: "presence", label: { ru: "Присутствие", en: "Presence" }, value: 88 },
      { key: "fear", label: { ru: "Страх", en: "Fear" }, value: 41 },
      { key: "ritual", label: { ru: "Ритуал", en: "Ritual" }, value: 92 },
      { key: "realityIntegrity", label: { ru: "Реальность", en: "Reality" }, value: 18 },
      { key: "silence", label: { ru: "Тишина", en: "Silence" }, value: 77 },
      { key: "transcendence", label: { ru: "Трансценд.", en: "Transcend." }, value: 63 },
    ],
    description: {
      ru: "Тишина пустой комнаты. Запах старых страниц и дыма. Ожидание ответа, который может никогда не прийти.",
      en: "The silence of an empty room. The smell of old pages and smoke. Waiting for an answer that may never come.",
    },
    tagline: { ru: "Голос из пустоты", en: "A voice from the void" },
    memoryFragments: {
      ru: ["# Холодный камень после дождя", "# Берёзовый дёготь", "# Дымок от потушенной свечи", "# Пыль старой библиотеки", "# Ночной горный воздух"],
      en: ["# Cold stone after rain", "# Birch tar", "# Smoke from a snuffed candle", "# Dust in an old library", "# Mountain air at night"],
    },
    origin: { coords: "59.9386° N, 30.3155° E", location: { ru: "Россия", en: "Russia" } },
    releaseDate: "13 / 05 / 2023",
    heroImage: "/images/seance/hero.png",
    gallery: [
      "/images/seance/crypt.png",
      "/images/seance/table.png",
      "/images/seance/lantern.png",
      "/images/seance/church.png",
      "/images/seance/chapel.png",
    ],
    accentColor: "#a89060",
    accentColorDim: "rgba(168,144,96,0.35)",
    radarFill: "rgba(168,144,96,0.12)",
    keywords: { ru: "СЫРОЙ · МИСТИЧЕСКИЙ · НЕВИДИМЫЙ", en: "RAW · MYSTICAL · UNSEEN" },
    guide: {
      plain: {
        ru: "Ладан и дым в старой каменной часовне ночью. Холодный воздух с гор, догоревшие свечи, старые книги — и чувство, что ты здесь не один.",
        en: "Incense and smoke in an old stone chapel at night. Cold mountain air, burnt-down candles, old books — and the feeling that you're not alone.",
      },
      drydown: [
        { when: { ru: "Первые минуты", en: "First minutes" }, notes: "top", text: { ru: "Холодный горный воздух, вода и бергамот. Как будто с мороза зашёл в тёмную часовню.", en: "Cold mountain air, water and bergamot. As if you stepped out of the frost into a dark chapel." } },
        { when: { ru: "Через полчаса", en: "After half an hour" }, notes: "heart", text: { ru: "Ладан, смолы и сухая старая бумага. Дым поднимается и заполняет всё вокруг.", en: "Incense, resins and dry old paper. The smoke rises and fills everything around." } },
        { when: { ru: "Через несколько часов и до утра", en: "Hours later, until morning" }, notes: "base", text: { ru: "Берёзовый дёготь и тёплое сандаловое дерево — как угли, которые ещё тлеют.", en: "Birch tar and warm sandalwood — like embers that are still smouldering." } },
      ],
      facets: [
        { label: { ru: "Дым", en: "Smoke" }, value: 96 },
        { label: { ru: "Ладан и смолы", en: "Incense & resin" }, value: 90 },
        { label: { ru: "Дерево", en: "Wood" }, value: 72 },
        { label: { ru: "Свежесть", en: "Freshness" }, value: 34 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 8 },
      ],
      sillage: { ru: "Очень мощный — заполняет комнату и остаётся после вас", en: "Huge — fills the room and stays after you leave" },
      season: { ru: "Осень и зима", en: "Autumn and winter" },
      time: { ru: "Вечер и ночь", en: "Evening and night" },
      tip: { ru: "Достаточно 1–2 распылений. Больше — и он будет душить.", en: "1–2 sprays are enough. More and it will smother." },
      scenes: {
        ru: ["Ладан в пустой каменной церкви.", "Оплывший воск догоревших свечей.", "Пожелтевшие страницы старой книги.", "Свитер, пропахший дымом костра."],
        en: ["Incense in an empty stone church.", "Melted wax from burnt-down candles.", "The yellowed pages of an old book.", "A sweater that smells of campfire smoke."],
      },
    },
  },
  {
    id: "sunlit-memories",
    name: "Sunlit Memories",
    emotionalPath: ["Love", "Nostalgia", "Warmth"],
    scentNotes: {
      top: { ru: ["Листья Ежевики", "Мята"], en: ["Blackberry Leaves", "Mint"] },
      heart: { ru: ["Ноты дождя", "Зеленые ноты", "Нероли", "Жасмин"], en: ["Rain Notes", "Green Notes", "Neroli", "Jasmine"] },
      base: { ru: ["Древесные ноты", "Белый мускус"], en: ["Woody Notes", "White Musk"] },
    },
    radarAxes: [
      { key: "nostalgia", label: { ru: "Ностальгия", en: "Nostalgia" }, value: 92 },
      { key: "happiness", label: { ru: "Счастье", en: "Happiness" }, value: 78 },
      { key: "serenity", label: { ru: "Безмятежность", en: "Serenity" }, value: 90 },
      { key: "clarity", label: { ru: "Ясность", en: "Clarity" }, value: 86 },
      { key: "warmth", label: { ru: "Тепло", en: "Warmth" }, value: 68 },
      { key: "freshness", label: { ru: "Свежесть", en: "Freshness" }, value: 87 },
    ],
    description: {
      ru: "Летний день, который остался в памяти навсегда. Свет сквозь листья, запах дождя на тёплой земле. Момент чистого счастья.",
      en: "A summer day that remained in memory forever. Light through the leaves, the smell of rain on warm earth. A moment of pure happiness.",
    },
    tagline: { ru: "Свет, который не гаснет", en: "Light that never fades" },
    memoryFragments: {
      ru: ["# Лист ежевики, сорванный с куста", "# Растёртая в пальцах мята", "# Цветущий апельсин", "# Тёплая земля после дождя", "# Белая футболка, высохшая на солнце"],
      en: ["# A blackberry leaf pulled off the bush", "# Mint rubbed between your fingers", "# Orange blossom", "# Warm earth after rain", "# A white T-shirt dried in the sun"],
    },
    origin: { coords: "45.4654° N, 9.1900° E", location: { ru: "Озеро Комо, Италия", en: "Lake Como, Italy" } },
    releaseDate: "18 / 06 / 2023",
    heroImage: "/images/sunlit-memories/view.webp",
    accentColor: "#8a9a6a",
    accentColorDim: "rgba(138,154,106,0.35)",
    radarFill: "rgba(138,154,106,0.12)",
    keywords: { ru: "ЗЕЛЁНЫЙ · ЧИСТЫЙ · ПРОЗРАЧНЫЙ", en: "GREEN · CLEAN · TRANSPARENT" },
    guide: {
      plain: {
        ru: "Сочный, влажный цветочный аромат — как сад сразу после тёплого летнего дождя. Ненавязчивый, но его замечают. Парфюм, которому можно доверять: подходит всегда и нравится всем.",
        en: "A juicy, dewy floral — like a garden right after a warm summer rain. Never pushy, yet people notice it. A perfume you can trust: it always fits and everyone loves it.",
      },
      drydown: [
        { when: { ru: "Утро · первые минуты", en: "Morning · first minutes" }, notes: "top", text: { ru: "Листья ежевики и мята — сочная зелень и роса в саду.", en: "Blackberry leaves and mint — juicy greenery and dew in the garden." } },
        { when: { ru: "Полдень · через час", en: "Noon · after an hour" }, notes: "heart", text: { ru: "Короткий тёплый дождь: мокрые камни, жасмин и нероли. Та самая влажность, за которую его любят.", en: "A short warm rain: wet stones, jasmine and neroli. The dewiness people love it for." } },
        { when: { ru: "Вечер · до конца дня", en: "Evening · until the day ends" }, notes: "base", text: { ru: "Тёплое дерево и чистая кожа после солнца — мягкий белый мускус.", en: "Warm wood and clean sun-kissed skin — soft white musk." } },
      ],
      facets: [
        { label: { ru: "Свежесть", en: "Freshness" }, value: 86 },
        { label: { ru: "Влажность, дождь", en: "Dewiness, rain" }, value: 82 },
        { label: { ru: "Сочная зелень", en: "Juicy greens" }, value: 80 },
        { label: { ru: "Белые цветы", en: "White flowers" }, value: 74 },
        { label: { ru: "Дерево", en: "Wood" }, value: 34 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 22 },
      ],
      sillage: { ru: "Средний — заметный, но не навязчивый", en: "Moderate — noticeable, never pushy" },
      season: { ru: "Лето и осень", en: "Summer and autumn" },
      time: { ru: "Каждый день, днём", en: "Every day, daytime" },
      tip: { ru: "Не знаешь, чем надушиться сегодня? Бери этот — он подойдёт всегда.", en: "Not sure what to wear today? Take this one — it always works." },
      scenes: {
        ru: ["Мокрая трава сразу после дождя.", "Жасмин, цветущий под открытым окном.", "Мокрые камни террасы, нагретые солнцем.", "Сад после летнего ливня."],
        en: ["Wet grass right after the rain.", "Jasmine blooming under an open window.", "Wet terrace stones warming in the sun.", "A garden after a summer downpour."],
      },
    },
  },
  {
    id: "russian-banya",
    name: "Russian Banya",
    emotionalPath: ["Ritual", "Warmth", "Peace"],
    scentNotes: {
      top: { ru: ["Пихта", "Сено", "Эвкалипт", "Лайм", "Мята"], en: ["Fir", "Hay", "Eucalyptus", "Lime", "Mint"] },
      heart: { ru: ["Кардамон", "Каннабис", "Смолы", "Дубовый мох", "Можжевельник", "Дымные ноты"], en: ["Cardamom", "Cannabis", "Resins", "Oakmoss", "Juniper", "Smoky Notes"] },
      base: { ru: ["Сандал", "Цитрусовые ноты", "Древесные ноты", "Бальзамические ноты", "Ваниль", "Дерево махагони", "Кедр"], en: ["Sandalwood", "Citrus Notes", "Woody Notes", "Balsamic Notes", "Vanilla", "Mahogany", "Cedar"] },
    },
    radarAxes: [
      { key: "grounding", label: { ru: "Заземление", en: "Grounding" }, value: 91 },
      { key: "ritual", label: { ru: "Ритуал", en: "Ritual" }, value: 89 },
      { key: "purification", label: { ru: "Очищение", en: "Purification" }, value: 84 },
      { key: "warmth", label: { ru: "Тепло", en: "Warmth" }, value: 88 },
      { key: "nostalgia", label: { ru: "Ностальгия", en: "Nostalgia" }, value: 72 },
      { key: "strength", label: { ru: "Сила", en: "Strength" }, value: 76 },
    ],
    description: {
      ru: "Жар, очищающий разум. Запах хвои и раскалённых камней. Глубокий вдох, возвращающий к истокам.",
      en: "Heat that clears the mind. The smell of pine needles and hot stones. A deep breath returning to the roots.",
    },
    tagline: { ru: "Очищение огнём", en: "Purified by fire" },
    memoryFragments: {
      ru: ["# Мокрое дерево", "# Хвоя пихты", "# Сухое сено", "# Дымок от печи", "# Можжевеловые ягоды"],
      en: ["# Wet wood", "# Fir needles", "# Dry hay", "# Smoke from the stove", "# Juniper berries"],
    },
    origin: { coords: "60.1020° N, 30.3155° E", location: { ru: "Россия", en: "Russia" } },
    releaseDate: "01 / 12 / 2023",
    heroImage: "/images/russian-banya/banya-night.webp",
    gallery: [
      "/images/russian-banya/parilka.webp",
      "/images/russian-banya/stage-heat.webp",
      "/images/russian-banya/stage-fresh.webp",
      "/images/russian-banya/snow-hole.webp",
    ],
    accentColor: "#7a9a5a",
    accentColorDim: "rgba(122,154,90,0.35)",
    radarFill: "rgba(122,154,90,0.12)",
    keywords: { ru: "СЫРОЙ · ПРИРОДНЫЙ · ПОГРУЖАЮЩИЙ", en: "RAW · NATURAL · IMMERSIVE" },
    guide: {
      plain: {
        ru: "Настоящая русская баня во флаконе. Сначала свежий пар с пихтой, эвкалиптом и мятой, потом жар раскалённых камней, можжевельник и лёгкий дымок. А под конец — тёплое чистое дерево, как полок после парной.",
        en: "A real Russian banya in a bottle. First fresh steam with fir, eucalyptus and mint, then the heat of red-hot stones, juniper and a little smoke. And at the end — warm clean wood, like the bench after the steam room.",
      },
      drydown: [
        { when: { ru: "Первый пар", en: "The first steam" }, notes: "top", text: { ru: "Свежо и бодро: пихта, эвкалипт, мята и немного сена. Как вдох, когда только открыл дверь парной.", en: "Fresh and bracing: fir, eucalyptus, mint and a little hay. Like the breath you take when you first open the steam-room door." } },
        { when: { ru: "Жар", en: "The heat" }, notes: "heart", text: { ru: "Становится горячо: кардамон, можжевельник, смолы и дымок от камней. Самая плотная, «банная» часть.", en: "It gets hot: cardamom, juniper, resins and smoke off the stones. The densest, most banya part." } },
        { when: { ru: "После парной", en: "After the steam" }, notes: "base", text: { ru: "Всё стихает до тёплого дерева: сандал, кедр, махагони и капля ванили. Чистая кожа и полотенце на плечах.", en: "Everything settles into warm wood: sandalwood, cedar, mahogany and a drop of vanilla. Clean skin and a towel on your shoulders." } },
      ],
      facets: [
        { label: { ru: "Хвоя и свежесть", en: "Pine & freshness" }, value: 88 },
        { label: { ru: "Дерево", en: "Wood" }, value: 85 },
        { label: { ru: "Пар и смолы", en: "Steam & resins" }, value: 76 },
        { label: { ru: "Пряность", en: "Spice" }, value: 60 },
        { label: { ru: "Дым", en: "Smoke" }, value: 52 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 28 },
      ],
      sillage: { ru: "Заметный — чувствуется на расстоянии шага", en: "Noticeable — people catch it from a step away" },
      season: { ru: "Лучше всего осень и зима", en: "Best in autumn and winter" },
      time: { ru: "Вечер и выходные: за город, на дачу, к камину", en: "Evenings and weekends: out of town, at the dacha, by the fire" },
      tip: { ru: "Нанесите на шею и свитер — на шерсти хвоя и дерево звучат теплее и мягче.", en: "Apply to your neck and your sweater — on wool the pine and wood come across warmer and softer." },
      scenes: {
        ru: ["Парная, когда только открываешь дверь.", "Распаренный пихтовый веник.", "Горячие камни, на которые плеснули воду с эвкалиптом.", "Мокрое дерево полка после парной."],
        en: ["The steam room the moment you open the door.", "A steamed fir besom.", "Hot stones splashed with eucalyptus water.", "The wet wooden bench after the steam."],
      },
    },
  },
  {
    id: "laundry-routine",
    name: "Laundry Routine",
    emotionalPath: ["Peace", "Silence", "Nostalgia"],
    scentNotes: {
      all: {
        ru: ["Лед", "Альдегиды", "Озоновые ноты", "Авокадо", "Ирис", "Цитрусовые ноты", "Белый мускус", "Кашмеран"],
        en: ["Ice", "Aldehydes", "Ozone Notes", "Avocado", "Iris", "Citrus Notes", "White Musk", "Cashmeran"],
      },
    },
    radarAxes: [
      { key: "cleanliness", label: { ru: "Чистота", en: "Cleanliness" }, value: 95 },
      { key: "lightness", label: { ru: "Лёгкость", en: "Lightness" }, value: 93 },
      { key: "freshness", label: { ru: "Свежесть", en: "Freshness" }, value: 92 },
      { key: "comfort", label: { ru: "Комфорт", en: "Comfort" }, value: 85 },
      { key: "calm", label: { ru: "Спокойствие", en: "Calm" }, value: 88 },
      { key: "clarity", label: { ru: "Ясность", en: "Clarity" }, value: 90 },
    ],
    description: {
      ru: "Простые движения, приносящие покой. Запах чистоты и холодного воздуха. Повседневность как медитация.",
      en: "Simple movements bringing peace. The smell of cleanliness and cold air. Everyday life as meditation.",
    },
    tagline: { ru: "Покой в простом", en: "Peace in the ordinary" },
    memoryFragments: {
      ru: ["# Стиральный порошок", "# Талый снег", "# Чистая наволочка", "# Мякоть авокадо", "# Рисовая пудра"],
      en: ["# Washing powder", "# Melting snow", "# A clean pillowcase", "# Avocado flesh", "# Rice powder"],
    },
    origin: { coords: "43.6532° N, 79.3832° W", location: { ru: "Торонто, Канада", en: "Toronto, Canada" } },
    releaseDate: "12 / 04 / 2024",
    heroImage: "/images/laundry-routine/yard.webp",
    gallery: [
      "/images/laundry-routine/drum.webp",
      "/images/laundry-routine/stage-wash.webp",
      "/images/laundry-routine/stage-rinse.webp",
      "/images/laundry-routine/stage-dry.webp",
    ],
    accentColor: "#8a9aaa",
    accentColorDim: "rgba(138,154,170,0.35)",
    radarFill: "rgba(138,154,170,0.12)",
    keywords: { ru: "ЧИСТЫЙ · МИНИМАЛЬНЫЙ · БЕЗУПРЕЧНЫЙ", en: "CLEAN · MINIMAL · PURE" },
    // the scent is linear (scentNotes.all); LaundryWorld maps each drydown stage to its own notes
    guide: {
      plain: {
        ru: "Чистое бельё, которое только что сняли с верёвки в холодный солнечный день. Сначала ледяная свежесть, альдегиды и капля цитруса, как открытое окно зимой. Потом мягкий ирис и сливочное авокадо. А дальше тёплый белый мускус и кашмеран, как свежая простыня, в которую хочется завернуться.",
        en: "Clean laundry just taken off the line on a cold sunny day. First icy freshness, aldehydes and a drop of citrus, like an open window in winter. Then soft iris and creamy avocado. And then warm white musk and cashmeran, like a fresh sheet you want to wrap yourself in.",
      },
      drydown: [
        { when: { ru: "Стирка", en: "Wash" }, notes: "top", text: { ru: "Холодно и искристо: лёд, альдегиды, озон и цитрус. Как первый вдох у открытой дверцы машинки.", en: "Cold and sparkling: ice, aldehydes, ozone and citrus. Like the first breath at the open machine door." } },
        { when: { ru: "Полоскание", en: "Rinse" }, notes: "heart", text: { ru: "Становится мягче: пудровый ирис и сливочное, чуть зелёное авокадо. Чистая вода и гладкий хлопок.", en: "It softens: powdery iris and creamy, slightly green avocado. Clean water and smooth cotton." } },
        { when: { ru: "Сушка на солнце", en: "Sun-dry" }, notes: "base", text: { ru: "Остаётся тёплое и уютное: белый мускус и кашмеран. Запах простыни, которая весь день висела на солнце.", en: "What stays is warm and cosy: white musk and cashmeran. The smell of a sheet that hung in the sun all day." } },
      ],
      facets: [
        { label: { ru: "Чистота", en: "Cleanliness" }, value: 95 },
        { label: { ru: "Холод и лёд", en: "Cold & ice" }, value: 78 },
        { label: { ru: "Мускус", en: "Musk" }, value: 74 },
        { label: { ru: "Пудра и ирис", en: "Powder & iris" }, value: 52 },
        { label: { ru: "Цитрус", en: "Citrus" }, value: 40 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 14 },
      ],
      sillage: { ru: "Близко к коже — как чистая рубашка", en: "Close to the skin — like a clean shirt" },
      season: { ru: "Весна, лето и солнечная зима", en: "Spring, summer and sunny winter" },
      time: { ru: "Каждый день: работа, учёба, выходные дома", en: "Every day: work, study, weekends at home" },
      tip: { ru: "Брызните на подушку и постель вечером — утром проснётесь в только что постиранном белье.", en: "Spray it on your pillow and bed at night — you'll wake up in freshly washed sheets." },
      scenes: {
        ru: ["Простыни, только что снятые с верёвки.", "Открытая дверца стиральной машины.", "Морозный воздух из открытой форточки.", "Стопка чистого хлопка из шкафа."],
        en: ["Sheets just taken off the line.", "The open door of a washing machine.", "Frosty air through an open window.", "A stack of clean cotton from the wardrobe."],
      },
    },
  },
  {
    id: "synthetic-ecstasy",
    name: "synthetic ecstasy",
    emotionalPath: ["Euphoria", "Madness", "Obsession"],
    scentNotes: {
      top: { ru: ["Пластик", "Альдегиды", "Лед", "Клубника"], en: ["Plastic", "Aldehydes", "Ice", "Strawberry"] },
      heart: { ru: ["Винил", "Лак для ногтей", "Белый мускус"], en: ["Vinyl", "Nail Polish", "White Musk"] },
      base: { ru: ["Ваниль", "Корень ириса", "Амбер", "Кашмеран", "Озоновые ноты"], en: ["Vanilla", "Orris Root", "Amber", "Cashmeran", "Ozone Notes"] },
    },
    radarAxes: [
      { key: "euphoria", label: { ru: "Эйфория", en: "Euphoria" }, value: 94 },
      { key: "artificiality", label: { ru: "Искусств.", en: "Artificiality" }, value: 96 },
      { key: "addiction", label: { ru: "Зависимость", en: "Addiction" }, value: 93 },
      { key: "intensity", label: { ru: "Интенсивность", en: "Intensity" }, value: 91 },
      { key: "dreamlike", label: { ru: "Сновидение", en: "Dreamlike" }, value: 82 },
      { key: "nostalgia", label: { ru: "Ностальгия", en: "Nostalgia" }, value: 74 },
    ],
    description: {
      ru: "Искусственный свет неона. Сладкий, токсичный аромат ночи. Чувство, что всё возможно прямо сейчас.",
      en: "Artificial neon light. Sweet, toxic scent of the night. The feeling that everything is possible right now.",
    },
    tagline: { ru: "Сладкий яд настоящего", en: "Sweet poison of the now" },
    memoryFragments: {
      ru: ["# от тебя пахнет клубничной жвачкой", "# лак на ногтях ещё не высох", "# почему от куртки пахнет новым винилом?", "# лёд в стакане с клубничной газировкой", "# ваниль и пудра на твоей подушке"],
      en: ["# you smell like strawberry bubblegum", "# the nail polish is still wet", "# why does the jacket smell of new vinyl?", "# ice in a glass of strawberry soda", "# vanilla and powder on your pillow"],
    },
    origin: { coords: "35.6895° N, 139.6917° E", location: { ru: "Токио, Япония", en: "Tokyo, Japan" } },
    releaseDate: "22 / 11 / 2023",
    heroImage: "/images/synthetic-ecstasy/alley.webp",
    gallery: [
      "/images/synthetic-ecstasy/scene-1.webp",
      "/images/synthetic-ecstasy/scene-2.webp",
      "/images/synthetic-ecstasy/scene-3.webp",
      "/images/synthetic-ecstasy/scene-4.webp",
    ],
    accentColor: "#c4507a",
    accentColorDim: "rgba(196,80,122,0.35)",
    radarFill: "rgba(196,80,122,0.12)",
    keywords: { ru: "СИНТЕТИЧЕСКИЙ · СЮРРЕАЛЬНЫЙ · АДДИКТИВНЫЙ", en: "SYNTHETIC · SURREAL · ADDICTIVE" },
    guide: {
      plain: {
        ru: "Клубничная жвачка, пластиковая игрушка и лёд в стакане газировки — сладко, холодно и совсем ненатурально. Потом винил и лак для ногтей, а под ними мягкая ваниль, ирис и тёплый амбер. Как неоновая ночь в Токио: ярко, искусственно и невозможно оторваться.",
        en: "Strawberry bubblegum, a plastic toy and ice in a glass of soda — sweet, cold and completely unnatural. Then vinyl and nail polish, and under them soft vanilla, iris and warm amber. Like a neon night in Tokyo: bright, artificial and impossible to put down.",
      },
      drydown: [
        { when: { ru: "Первая банка", en: "The first can" }, notes: "top", text: { ru: "Клубника со льдом, альдегиды и запах новой пластиковой игрушки. Шипит, искрит и холодит, как газировка из автомата.", en: "Strawberry on ice, aldehydes and the smell of a new plastic toy. It fizzes, sparkles and chills like a vending-machine soda." } },
        { when: { ru: "Вторая банка", en: "The second can" }, notes: "heart", text: { ru: "Глянцевый винил, лак для ногтей и белый мускус. Странно, искусственно и почему-то очень красиво.", en: "Glossy vinyl, nail polish and white musk. Strange, artificial and somehow very beautiful." } },
        { when: { ru: "Последняя банка", en: "The last can" }, notes: "base", text: { ru: "Всё становится мягким и тёплым: ваниль, пудровый корень ириса, амбер и кашмеран. Как плед в такси по дороге домой на рассвете.", en: "Everything turns soft and warm: vanilla, powdery orris root, amber and cashmeran. Like a blanket in a taxi on the way home at dawn." } },
      ],
      facets: [
        { label: { ru: "Сладость", en: "Sweetness" }, value: 82 },
        { label: { ru: "Пластик и винил", en: "Plastic & vinyl" }, value: 88 },
        { label: { ru: "Ягоды", en: "Berries" }, value: 72 },
        { label: { ru: "Холод и лёд", en: "Cold & ice" }, value: 60 },
        { label: { ru: "Пудра", en: "Powder" }, value: 54 },
        { label: { ru: "Тепло и амбер", en: "Warmth & amber" }, value: 50 },
      ],
      sillage: { ru: "Заметный — сладкий след за вами", en: "Noticeable — a sweet trail behind you" },
      season: { ru: "Круглый год, особенно ночью", en: "All year round, especially at night" },
      time: { ru: "Вечеринки, клубы, ночные прогулки", en: "Parties, clubs, night walks" },
      tip: { ru: "Нанесите на волосы и на одежду — на ткани пластиковая клубника звучит ярче всего.", en: "Spray it on your hair and clothes — the plastic strawberry is brightest on fabric." },
      scenes: {
        ru: ["Мокрый асфальт под неоновой вывеской.", "Клубничная газировка со льдом из круглосуточного.", "Виниловые диваны в караоке.", "Новая пластиковая игрушка из автомата."],
        en: ["Wet asphalt under a neon sign.", "Strawberry soda on ice from a 24-hour store.", "Vinyl sofas in a karaoke room.", "A new plastic toy from a claw machine."],
      },
    },
  },
  {
    id: "highest-in-the-room",
    name: "Highest in the room",
    emotionalPath: ["Euphoria", "Confidence", "Madness"],
    scentNotes: {
      top: { ru: ["Каннабис", "Розовый перец", "Шафран"], en: ["Cannabis", "Pink Pepper", "Saffron"] },
      heart: { ru: ["Франжипани", "Ирис", "Замша", "Шафран", "Мускус"], en: ["Frangipani", "Iris", "Suede", "Saffron", "Musk"] },
      base: { ru: ["Патчули", "Сандал", "Кашмеран", "Сухая древесина", "Дубовый мох"], en: ["Patchouli", "Sandalwood", "Cashmeran", "Dry Wood", "Oakmoss"] },
    },
    radarAxes: [
      { key: "euphoria", label: { ru: "Эйфория", en: "Euphoria" }, value: 93 },
      { key: "dreaminess", label: { ru: "Мечтательность", en: "Dreaminess" }, value: 72 },
      { key: "detachment", label: { ru: "Отстранённость", en: "Detachment" }, value: 87 },
      { key: "confidence", label: { ru: "Уверенность", en: "Confidence" }, value: 90 },
      { key: "creativity", label: { ru: "Творчество", en: "Creativity" }, value: 76 },
      { key: "intensity", label: { ru: "Интенсивность", en: "Intensity" }, value: 88 },
    ],
    description: {
      ru: "Взгляд сверху вниз. Плотный дым и дорогая замша. Уверенность, граничащая с безрассудством.",
      en: "Looking down from above. Dense smoke and expensive suede. Confidence bordering on recklessness.",
    },
    tagline: { ru: "Выше всех в комнате", en: "Highest in the room" },
    memoryFragments: {
      ru: ["# Замша", "# Шафран", "# Остывшая пепельница", "# Патчули", "# Сухое дерево"],
      en: ["# Suede", "# Saffron", "# A cold ashtray", "# Patchouli", "# Dry wood"],
    },
    origin: { coords: "40.7484° N, 73.9857° W", location: { ru: "Нью-Йорк, США", en: "New York, USA" } },
    releaseDate: "21 / 09 / 2023",
    heroImage: "/images/highest-in-the-room/penthouse.webp",
    gallery: [
      "/images/highest-in-the-room/elevator.webp",
      "/images/highest-in-the-room/cover-top.webp",
      "/images/highest-in-the-room/cover-heart.webp",
      "/images/highest-in-the-room/cover-base.webp",
    ],
    accentColor: "#c9a96e",
    accentColorDim: "rgba(201,169,110,0.35)",
    radarFill: "rgba(201,169,110,0.12)",
    keywords: { ru: "СЫРОЙ · РОСКОШНЫЙ · АДДИКТИВНЫЙ", en: "RAW · LUXURIOUS · ADDICTIVE" },
    guide: {
      plain: {
        ru: "Ночь в пентхаусе на Манхэттене, где-то в 1979-м. Сначала пряный зелёный дымок каннабиса с розовым перцем и шафраном, потом мягкая замша и чёрная кожа с цветами франжипани и ириса. А под конец — сухое дерево, патчули и дубовый мох, как сигарный хьюмидор и кожаный диван под утро.",
        en: "A night in a Manhattan penthouse, somewhere around 1979. First a spicy green haze of cannabis with pink pepper and saffron, then soft suede and black leather with frangipani and iris. And at the end — dry wood, patchouli and oakmoss, like a cigar humidor and a leather sofa at dawn.",
      },
      drydown: [
        { when: { ru: "Первые минуты", en: "The first minutes" }, notes: "top", text: { ru: "Ярко и дерзко: зелёный дымок каннабиса, искры розового перца и тёплый шафран. Как дверь, открывшаяся в накуренную комнату.", en: "Bright and bold: a green haze of cannabis, sparks of pink pepper and warm saffron. Like a door opening into a smoky room." } },
        { when: { ru: "Сердце ночи", en: "The heart of the night" }, notes: "heart", text: { ru: "Становится мягко и дорого: замша, ирис и сливочная франжипани. Чёрная кожаная куртка и цветок в петлице.", en: "It turns soft and expensive: suede, iris and creamy frangipani. A black leather jacket and a flower in the buttonhole." } },
        { when: { ru: "Под утро", en: "Towards dawn" }, notes: "base", text: { ru: "Всё оседает в сухое дерево: патчули, сандал, кашмеран и дубовый мох. Пустой хьюмидор, остывшая пепельница и тёплая кожа.", en: "It all settles into dry wood: patchouli, sandalwood, cashmeran and oakmoss. An empty humidor, a cold ashtray and warm skin." } },
      ],
      facets: [
        { label: { ru: "Дым и травы", en: "Smoke & herbs" }, value: 86 },
        { label: { ru: "Кожа и замша", en: "Leather & suede" }, value: 82 },
        { label: { ru: "Дерево", en: "Wood" }, value: 78 },
        { label: { ru: "Пряность", en: "Spice" }, value: 70 },
        { label: { ru: "Цветы", en: "Flowers" }, value: 48 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 22 },
      ],
      sillage: { ru: "Сильный — его замечают, когда вы входите в комнату", en: "Strong — people notice it when you walk into the room" },
      season: { ru: "Осень и зима, прохладные вечера весны", en: "Autumn and winter, cool spring evenings" },
      time: { ru: "Вечер и ночь: ужин, бар, вечеринка, свидание", en: "Evening and night: dinner, a bar, a party, a date" },
      tip: { ru: "Хватит двух распылений — на шею и на запястье. Он громкий, пусть говорит сам.", en: "Two sprays are enough — neck and wrist. It's loud; let it speak for itself." },
      scenes: {
        ru: ["Мокрый асфальт Манхэттена после дождя.", "Сигарный хьюмидор и стакан виски.", "Сладковатый дым под потолком вечеринки.", "Старая кожаная куртка и картонные конверты пластинок."],
        en: ["Wet Manhattan asphalt after the rain.", "A cigar humidor and a glass of whiskey.", "Sweetish smoke under the ceiling at a party.", "An old leather jacket and cardboard record sleeves."],
      },
    },
  },
  {
    id: "silent-fog",
    name: "Silent Fog",
    emotionalPath: ["Isolation", "Silence", "Peace"],
    scentNotes: {
      top: { ru: ["Озоновые ноты", "Альдегиды", "Ноты дождя", "Мята"], en: ["Ozone Notes", "Aldehydes", "Rain Notes", "Mint"] },
      heart: { ru: ["Iso-e-super", "Горный воздух", "Бальзамические ноты", "Корень ириса", "Кашмеран"], en: ["Iso E Super", "Mountain Air", "Balsamic Notes", "Orris Root", "Cashmeran"] },
      base: { ru: ["Сухая древесина", "Белый мускус", "Дубовый мох", "Березовый деготь"], en: ["Dry Wood", "White Musk", "Oakmoss", "Birch Tar"] },
    },
    radarAxes: [
      { key: "calm", label: { ru: "Спокойствие", en: "Calm" }, value: 89 },
      { key: "clarity", label: { ru: "Ясность", en: "Clarity" }, value: 58 },
      { key: "isolation", label: { ru: "Изоляция", en: "Isolation" }, value: 76 },
      { key: "detachment", label: { ru: "Отстранённость", en: "Detachment" }, value: 83 },
      { key: "melancholy", label: { ru: "Меланхолия", en: "Melancholy" }, value: 71 },
      { key: "nostalgia", label: { ru: "Ностальгия", en: "Nostalgia" }, value: 65 },
    ],
    description: {
      ru: "Белая пелена, скрывающая мир. Холод, проникающий под кожу. Идеальное укрытие от всего.",
      en: "A white veil hiding the world. Cold penetrating under the skin. A perfect hideout from everything.",
    },
    tagline: { ru: "Там, где тебя не найдут", en: "Where they won't find you" },
    memoryFragments: {
      ru: ["# Воздух после ливня", "# Дегтярное мыло", "# Сырой мох на камнях", "# Мятный холодок", "# Сухие дрова в сарае"],
      en: ["# Air after a downpour", "# Birch tar soap", "# Damp moss on stones", "# A cool hint of mint", "# Dry firewood in the shed"],
    },
    origin: { coords: "54.5186° N, 37.5665° E", location: { ru: "Россия", en: "Russia" } },
    releaseDate: "22 / 08 / 2023",
    heroImage: "/images/silent-fog/grove.webp",
    gallery: [
      "/images/silent-fog/white.webp",
      "/images/silent-fog/black.webp",
      "/images/silent-fog/stage-rain.webp",
      "/images/silent-fog/stage-tar.webp",
    ],
    accentColor: "#7a8a8a",
    accentColorDim: "rgba(122,138,138,0.35)",
    radarFill: "rgba(122,138,138,0.12)",
    keywords: { ru: "СЫРОЙ · ВОДНЫЙ · ПОЛУПРОЗРАЧНЫЙ", en: "RAW · AQUEOUS · TRANSLUCENT" },
    guide: {
      plain: {
        ru: "Берёзовая роща в густом утреннем тумане. Сначала холодный влажный воздух после дождя, озон и капля мяты, как первый вдох у открытого окна. Потом прохладный горный воздух и пудровый ирис. А под всем этим — чёрный берёзовый дёготь, сухое дерево и мох: дымный, смолистый, совсем тёмный. Белое и чёрное на одной коже.",
        en: "A birch grove in thick morning fog. First cold wet air after rain, ozone and a drop of mint, like the first breath at an open window. Then cool mountain air and powdery iris. And beneath it all, black birch tar, dry wood and moss: smoky, resinous, truly dark. White and black on the same skin.",
      },
      drydown: [
        { when: { ru: "Дождь", en: "Rain" }, notes: "top", text: { ru: "Холодно и мокро: озон, альдегиды, дождевая вода и мята. Как будто вышел на улицу сразу после ливня.", en: "Cold and wet: ozone, aldehydes, rainwater and mint. As if you stepped outside right after a downpour." } },
        { when: { ru: "Туман", en: "Fog" }, notes: "heart", text: { ru: "Становится тихо и прозрачно: горный воздух, корень ириса, кашмеран. Мягкая белая пелена, в которой ничего не слышно.", en: "It goes quiet and sheer: mountain air, orris root, cashmeran. A soft white veil where you can't hear a thing." } },
        { when: { ru: "Дёготь", en: "Tar" }, notes: "base", text: { ru: "Туман уходит, и проступает тёмное: берёзовый дёготь, сухое дерево, дубовый мох и белый мускус. Дымно, смолисто и очень близко к коже.", en: "The fog lifts and the dark shows through: birch tar, dry wood, oakmoss and white musk. Smoky, resinous and very close to the skin." } },
      ],
      facets: [
        { label: { ru: "Свежесть и озон", en: "Freshness & ozone" }, value: 88 },
        { label: { ru: "Дёготь и дым", en: "Tar & smoke" }, value: 84 },
        { label: { ru: "Дерево", en: "Wood" }, value: 72 },
        { label: { ru: "Пудра и ирис", en: "Powder & iris" }, value: 54 },
        { label: { ru: "Мох", en: "Moss" }, value: 50 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 10 },
      ],
      sillage: { ru: "Умеренный — близко к коже, но с тёмным следом", en: "Moderate — close to the skin, with a dark trail" },
      season: { ru: "Осень, зима и дождливая весна", en: "Autumn, winter and rainy spring" },
      time: { ru: "Утро, прогулки, работа, тихие вечера дома", en: "Mornings, walks, work, quiet evenings at home" },
      tip: { ru: "Нанесите на шарф или воротник: на ткани дёготь и озон звучат чище, чем на коже.", en: "Spray it on a scarf or a collar: tar and ozone smell cleaner on fabric than on skin." },
      scenes: {
        ru: ["Мокрый асфальт на рассвете.", "Берёзовая кора после дождя.", "Холодный туман над озером.", "Дегтярное мыло на краю раковины."],
        en: ["Wet asphalt at dawn.", "Birch bark after rain.", "Cold fog over the lake.", "Birch tar soap on the edge of the sink."],
      },
    },
  },
  {
    id: "narcisstic-king",
    name: "narcisstic king",
    emotionalPath: ["Obsession", "Confidence", "Love"],
    scentNotes: {
      top: { ru: ["Малина", "Ежевика", "Розовый перец"], en: ["Raspberry", "Blackberry", "Pink Pepper"] },
      heart: { ru: ["Шафран", "Роза", "Ямайский перец", "Жасмин"], en: ["Saffron", "Rose", "Jamaican Pepper", "Jasmine"] },
      base: { ru: ["Кожа", "Уд", "Табак", "Патчули", "Дубовый мох", "Ваниль", "Мускус", "Ирис", "Амбер"], en: ["Leather", "Oud", "Tobacco", "Patchouli", "Oakmoss", "Vanilla", "Musk", "Iris", "Amber"] },
    },
    radarAxes: [
      { key: "dominance", label: { ru: "Доминирование", en: "Dominance" }, value: 95 },
      { key: "pride", label: { ru: "Гордость", en: "Pride" }, value: 91 },
      { key: "obsession", label: { ru: "Одержимость", en: "Obsession" }, value: 89 },
      { key: "sensuality", label: { ru: "Чувственность", en: "Sensuality" }, value: 82 },
      { key: "mystery", label: { ru: "Тайна", en: "Mystery" }, value: 74 },
      { key: "darkness", label: { ru: "Тьма", en: "Darkness" }, value: 87 },
    ],
    description: {
      ru: "Корона из золота и шипов. Тяжёлый взгляд. Запах власти, кожи и сладкой крови.",
      en: "A crown of gold and thorns. A heavy gaze. The smell of power, leather, and sweet blood.",
    },
    tagline: { ru: "Власть — это аромат", en: "Power is a scent" },
    memoryFragments: {
      ru: ["# Раздавленная малина", "# Ежевичное варенье", "# Шафран", "# Табачный лист", "# Кожаный салон автомобиля"],
      en: ["# Crushed raspberries", "# Blackberry jam", "# Saffron", "# Tobacco leaf", "# A car's leather interior"],
    },
    origin: { coords: "51.5074° N, 0.1278° W", location: { ru: "Лондон, Великобритания", en: "London, UK" } },
    releaseDate: "07 / 11 / 2023",
    heroImage: "https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/hero-narcisstic-king-TGCKoeVhq48EcaY2wC8RrU.webp",
    accentColor: "#c9a96e",
    accentColorDim: "rgba(201,169,110,0.35)",
    radarFill: "rgba(201,169,110,0.12)",
    keywords: { ru: "СЫРОЙ · РОСКОШНЫЙ · ДОМИНИРУЮЩИЙ", en: "RAW · OPULENT · DOMINANT" },
    guide: {
      plain: {
        ru: "Тёмные ягоды, раздавленные в кожаной перчатке. Сначала сочная малина и ежевика с розовым перцем — сладко, ярко и чуть колко. Потом густой шафран и тёмная роза: по-королевски тяжело и тепло. А в основе кожа, уд и табак, которые ваниль и амбра делают бархатными. Громкий, дорогой, вечерний аромат — он входит в комнату раньше вас.",
        en: "Dark berries crushed inside a leather glove. First juicy raspberry and blackberry with pink pepper — sweet, bright and a little prickly. Then dense saffron and a dark rose: heavy and warm, like royalty. And underneath, leather, oud and tobacco, made velvety by vanilla and amber. A loud, expensive evening scent — it walks into the room before you do.",
      },
      drydown: [
        { when: { ru: "Кровь", en: "Blood" }, notes: "top", text: { ru: "Первые минуты: малина и ежевика лопаются, как спелые ягоды, розовый перец щекочет нос. Сладко и дерзко.", en: "The first minutes: raspberry and blackberry burst like ripe fruit, pink pepper tickles the nose. Sweet and bold." } },
        { when: { ru: "Золото", en: "Gold" }, notes: "heart", text: { ru: "Через полчаса приходят шафран и роза. Пряно, густо, немного металлически — как золото, нагретое в руке.", en: "After half an hour saffron and rose arrive. Spicy, dense, a little metallic — like gold warmed in your hand." } },
        { when: { ru: "Кожа", en: "Leather" }, notes: "base", text: { ru: "К вечеру остаются кожа, уд и табак, а под ними ваниль, ирис и амбра. Тёмно, тепло и очень уверенно — до самой ночи.", en: "By evening leather, oud and tobacco remain, with vanilla, iris and amber beneath. Dark, warm and very sure of itself — all night long." } },
      ],
      facets: [
        { label: { ru: "Кожа и уд", en: "Leather & oud" }, value: 90 },
        { label: { ru: "Тёмные ягоды", en: "Dark berries" }, value: 82 },
        { label: { ru: "Пряности и шафран", en: "Spice & saffron" }, value: 74 },
        { label: { ru: "Роза", en: "Rose" }, value: 62 },
        { label: { ru: "Табак и дым", en: "Tobacco & smoke" }, value: 58 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 46 },
      ],
      sillage: { ru: "Мощный — его слышно через всю комнату", en: "Powerful — noticed across the whole room" },
      season: { ru: "Осень и зима", en: "Autumn and winter" },
      time: { ru: "Вечер, ужины, выходы в свет, важные встречи", en: "Evenings, dinners, nights out, big meetings" },
      tip: { ru: "Хватит двух нажатий — на запястье и на шею. Больше — и он займёт всю комнату.", en: "Two sprays are enough — wrist and neck. Any more and it takes over the room." },
      scenes: {
        ru: ["Тёмная роза в хрустальной вазе.", "Новые кожаные перчатки.", "Табачная лавка со старым деревом на полках.", "Бокал красного вина у камина."],
        en: ["A dark rose in a crystal vase.", "New leather gloves.", "A tobacco shop with old wooden shelves.", "A glass of red wine by the fire."],
      },
    },
  },
  {
    id: "self-addicted",
    name: "Self addicted",
    emotionalPath: ["Love", "Obsession", "Euphoria"],
    scentNotes: {
      top: { ru: ["Дамасская роза", "Нероли", "Франжипани", "Гардения", "Розовый перец"], en: ["Damask Rose", "Neroli", "Frangipani", "Gardenia", "Pink Pepper"] },
      heart: { ru: ["Корица", "Гедион"], en: ["Cinnamon", "Hedione"] },
      base: { ru: ["Ваниль", "Бобы тонка", "Карамель", "Кашмеран", "Кедр", "Сандал", "Амбра", "Табак", "Перуанский бальзам"], en: ["Vanilla", "Tonka Bean", "Caramel", "Cashmeran", "Cedar", "Sandalwood", "Amber", "Tobacco", "Peru Balsam"] },
    },
    radarAxes: [
      { key: "obsession", label: { ru: "Одержимость", en: "Obsession" }, value: 92 },
      { key: "selfDestruction", label: { ru: "Саморазруш.", en: "Self Destr." }, value: 67 },
      { key: "desire", label: { ru: "Желание", en: "Desire" }, value: 88 },
      { key: "dependency", label: { ru: "Зависимость", en: "Dependency" }, value: 81 },
      { key: "melancholy", label: { ru: "Меланхолия", en: "Melancholy" }, value: 46 },
      { key: "pleasure", label: { ru: "Удовольствие", en: "Pleasure" }, value: 85 },
    ],
    description: {
      ru: "Отражение, от которого невозможно оторваться. Сладкий яд самовлюблённости. Идеальная зависимость.",
      en: "A reflection you can't look away from. The sweet poison of narcissism. A perfect addiction.",
    },
    tagline: { ru: "Влюблён в себя навсегда", en: "In love with yourself forever" },
    memoryFragments: {
      ru: ["# Чем ты пахнешь? Сахар и ваниль на весь зал", "# Подушка до сих пор пахнет твоей карамелью", "# В лифте после тебя пахнет корицей и сахаром", "# Что за духи? Цветущий апельсин и пудра", "# Весь вечер пахло только тобой"],
      en: ["# What are you wearing? Sugar and vanilla across the whole room", "# The pillow still smells of your caramel", "# The lift smells of cinnamon and sugar after you", "# What perfume is that? Orange blossom and powder", "# All night it only smelled of you"],
    },
    origin: { coords: "48.8566° N, 2.3522° E", location: { ru: "Франция", en: "France" } },
    releaseDate: "14 / 02 / 2024",
    heroImage: "/images/self-addicted/hero.png",
    gallery: [
      "/images/self-addicted/roses.png",
      "/images/self-addicted/ballerina.png",
      "/images/self-addicted/mirror.png",
      "/images/self-addicted/bedroom.png",
    ],
    accentColor: "#c4607a",
    accentColorDim: "rgba(196,96,122,0.35)",
    radarFill: "rgba(196,96,122,0.12)",
    keywords: { ru: "СЫРОЙ · БОГАТЫЙ · ИНТОКСИЦИРУЮЩИЙ", en: "RAW · RICH · INTOXICATING" },
    guide: {
      plain: {
        ru: "Сахар, цветущий апельсин и пудра. Необычная гурманика, от которой невозможно оторваться. Самый мощный аромат коллекции: его слышно за 10–15 метров, и рядом с ним остальные ароматы просто меркнут.",
        en: "Sugar, orange blossom and powder. An unusual gourmand you can't pull away from. The most powerful scent in the collection: people notice it 10–15 metres away, and every other perfume in the room simply fades.",
      },
      drydown: [
        { when: { ru: "Первые минуты", en: "First minutes" }, notes: "top", text: { ru: "Сразу сахар и чуть цветущего апельсина. Нероли, роза и розовый перец — ярко, сладко и празднично.", en: "Sugar straight away, with a touch of orange blossom. Neroli, rose and pink pepper — bright, sweet and festive." } },
        { when: { ru: "Через час", en: "After an hour" }, notes: "heart", text: { ru: "Становится пудровым и мягким. Тёплая корица обволакивает, сладость никуда не уходит.", en: "It turns powdery and soft. Warm cinnamon wraps around you, the sweetness stays." } },
        { when: { ru: "До самого утра", en: "Until morning" }, notes: "base", text: { ru: "Сахарная пудровая база: ваниль, тонка, карамель и амбра. Именно за ней оборачиваются.", en: "A sugary, powdery base: vanilla, tonka, caramel and amber. This is what makes people turn around." } },
      ],
      facets: [
        { label: { ru: "Сладость", en: "Sweetness" }, value: 95 },
        { label: { ru: "Карамель и ваниль", en: "Caramel & vanilla" }, value: 90 },
        { label: { ru: "Пудровость", en: "Powderiness" }, value: 84 },
        { label: { ru: "Цветы", en: "Flowers" }, value: 55 },
        { label: { ru: "Пряность", en: "Spice" }, value: 40 },
        { label: { ru: "Дерево", en: "Wood" }, value: 32 },
      ],
      sillage: { ru: "Огромный — диффузия 10–15 метров", en: "Enormous — 10–15 metres of diffusion" },
      season: { ru: "Лучше всего зима и весна, но подойдёт в любой сезон", en: "Best in winter and spring, but works any season" },
      time: { ru: "Вечер: свидание, мероприятие, выход", en: "Evening: a date, an event, a night out" },
      tip: { ru: "Начните с одного распыления — этого хватит, чтобы вас заметили.", en: "Start with one spray — that's enough to be noticed." },
      scenes: {
        ru: ["Сахар и ваниль на весь зал.", "Подушка, пахнущая карамелью и пудрой.", "Сахарная пудра на губах.", "Цветущий апельсин и холодное шампанское."],
        en: ["Sugar and vanilla across the whole room.", "A pillow smelling of caramel and powder.", "Powdered sugar on your lips.", "Orange blossom and cold champagne."],
      },
    },
  },
  {
    id: "summer-of-2009",
    name: "Summer of 2009",
    emotionalPath: ["Nostalgia", "Love", "Warmth"],
    scentNotes: {
      all: {
        ru: ["Лист черной смородины", "Зеленые ноты", "Конопля", "Воздушные ноты", "Жасмин", "Турецкая Роза", "Зеленое яблоко", "Белый мускус", "Iso E Super", "Патчули"],
        en: ["Blackcurrant Leaf", "Green Notes", "Cannabis", "Airy Notes", "Jasmine", "Turkish Rose", "Green Apple", "White Musk", "Iso E Super", "Patchouli"],
      },
    },
    radarAxes: [
      { key: "nostalgia", label: { ru: "Ностальгия", en: "Nostalgia" }, value: 91 },
      { key: "love", label: { ru: "Любовь", en: "Love" }, value: 72 },
      { key: "isolation", label: { ru: "Изоляция", en: "Isolation" }, value: 18 },
      { key: "melancholy", label: { ru: "Меланхолия", en: "Melancholy" }, value: 47 },
      { key: "memoryClarity", label: { ru: "Ясность памяти", en: "Memory Clarity" }, value: 33 },
      { key: "warmth", label: { ru: "Тепло", en: "Warmth" }, value: 64 },
    ],
    description: {
      ru: "Воздух густой от влажности. Листья чёрной смородины пачкают пальцы. Старые песни из треснувшего динамика. Всё кажется бесконечным.",
      en: "The air is thick with humidity. Blackcurrant leaves stain your fingers. Old songs on a cracked speaker. Everything feels infinite.",
    },
    tagline: { ru: "Лето, которое не кончается", en: "The summer that never ended" },
    memoryFragments: {
      ru: ["# Лист чёрной смородины", "# Зелёное яблоко с ветки", "# Скошенная трава", "# Дым костра", "# Жасмин у забора"],
      en: ["# Blackcurrant leaf", "# A green apple off the branch", "# Cut grass", "# Bonfire smoke", "# Jasmine by the fence"],
    },
    origin: { coords: "55.5827° N, 39.1285° E", location: { ru: "Россия", en: "Russia" } },
    releaseDate: "01 / 10 / 2023",
    heroImage: "/images/summer-of-2009/wallpaper.webp",
    gallery: [
      "/images/summer-of-2009/stage-1.webp",
      "/images/summer-of-2009/stage-2.webp",
      "/images/summer-of-2009/stage-3.webp",
      "/images/summer-of-2009/photo-1.webp",
    ],
    accentColor: "#7a9a5a",
    accentColorDim: "rgba(122,154,90,0.35)",
    radarFill: "rgba(122,154,90,0.12)",
    keywords: { ru: "СЫРОЙ · ПРИРОДНЫЙ · НЕФИЛЬТРОВАННЫЙ", en: "RAW · NATURAL · UNFILTERED" },
    // the scent is linear (scentNotes.all); SummerWorld maps each drydown stage to its own notes
    guide: {
      plain: {
        ru: "Конец июля на даче. Сорвал лист чёрной смородины, растёр в пальцах — и вот он, этот запах: зелёный, терпкий, немного кошачий. Рядом зелёное яблоко, трава и жасмин у забора, а к вечеру тёплый воздух, роза и мягкий мускус, как кофта, в которой сидел у костра.",
        en: "Late July at the dacha. You pick a blackcurrant leaf, rub it between your fingers — and there it is: green, tart, a little catty. Next to it green apple, grass and jasmine by the fence, and by evening warm air, rose and soft musk, like the jumper you wore by the bonfire.",
      },
      drydown: [
        { when: { ru: "Утро, огород", en: "Morning, the garden" }, notes: "top", text: { ru: "Резко и зелено: лист чёрной смородины, трава, зелёное яблоко и немного конопли с соседнего поля. Сочно и чуть горьковато.", en: "Sharp and green: blackcurrant leaf, grass, green apple and a little hemp from the next field. Juicy and slightly bitter." } },
        { when: { ru: "День, у забора", en: "Afternoon, by the fence" }, notes: "heart", text: { ru: "Становится цветочно и воздушно: жасмин, турецкая роза и тёплый ветер. Полдень, когда всё вокруг гудит от жары.", en: "It turns floral and airy: jasmine, Turkish rose and a warm breeze. Midday, when everything hums in the heat." } },
        { when: { ru: "Вечер, светлячки", en: "Evening, fireflies" }, notes: "base", text: { ru: "Остаётся мягкое и тёплое: белый мускус, Iso E Super и немного патчули. Как кожа после целого дня на солнце.", en: "What stays is soft and warm: white musk, Iso E Super and a touch of patchouli. Like skin after a whole day in the sun." } },
      ],
      facets: [
        { label: { ru: "Зелень и листья", en: "Greens & leaves" }, value: 92 },
        { label: { ru: "Ягоды", en: "Berries" }, value: 70 },
        { label: { ru: "Цветы", en: "Flowers" }, value: 58 },
        { label: { ru: "Свежесть", en: "Freshness" }, value: 64 },
        { label: { ru: "Мускус", en: "Musk" }, value: 46 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 22 },
      ],
      sillage: { ru: "Умеренный — слышно, когда обнимаешь", en: "Moderate — noticeable when you hug" },
      season: { ru: "Конец весны и лето", en: "Late spring and summer" },
      time: { ru: "День, прогулки, поездки за город", en: "Daytime, walks, trips out of town" },
      tip: { ru: "Нанесите на запястья и потрите их о футболку — на хлопке смородина звучит зеленее.", en: "Apply to your wrists and rub them on your t-shirt — on cotton the blackcurrant smells greener." },
      scenes: {
        ru: ["Горячая пыль на просёлочной дороге.", "Смородиновое варенье на клеёнке.", "Высокая трава по дороге к речке.", "Берёзовые листья над гамаком.", "Нагретый солнцем подоконник.", "Тина и вода в пруду вечером."],
        en: ["Hot dust on a country road.", "Blackcurrant jam on the oilcloth.", "Tall grass on the way to the river.", "Birch leaves over the hammock.", "A windowsill warmed by the sun.", "Pond weed and water in the evening."],
      },
    },
  },
  {
    id: "santa-caecilia",
    name: "Santa Caecilia",
    emotionalPath: ["Devotion", "Peace", "Love"],
    scentNotes: {
      top: { ru: ["Белые цветы", "Воздушные ноты"], en: ["White Flowers", "Airy Notes"] },
      heart: { ru: ["Лилия", "Жасмин", "Гардения", "Франжипани"], en: ["Lily", "Jasmine", "Gardenia", "Frangipani"] },
      base: { ru: ["Древесные ноты", "Амбра", "Мускус", "Пачули", "Дубовый мох"], en: ["Woody Notes", "Ambergris", "Musk", "Patchouli", "Oakmoss"] },
    },
    radarAxes: [
      { key: "purity", label: { ru: "Чистота", en: "Purity" }, value: 94 },
      { key: "devotion", label: { ru: "Преданность", en: "Devotion" }, value: 90 },
      { key: "light", label: { ru: "Свет", en: "Light" }, value: 86 },
      { key: "serenity", label: { ru: "Безмятежность", en: "Serenity" }, value: 82 },
      { key: "tenderness", label: { ru: "Нежность", en: "Tenderness" }, value: 88 },
      { key: "melancholy", label: { ru: "Меланхолия", en: "Melancholy" }, value: 41 },
    ],
    description: {
      ru: "Белая лилия на холодном мраморе. Музыка, которую слышит только тот, кто молчит. Нежность, которая сильнее страха.",
      en: "A white lily on cold marble. Music heard only by those who keep silent. A tenderness stronger than fear.",
    },
    tagline: { ru: "Песнь в сердце", en: "A song in the heart" },
    memoryFragments: {
      ru: ["# Лилии на алтаре", "# Жасмин после заката", "# Белая франжипани", "# Старый дуб и мох", "# Чистая кожа"],
      en: ["# Lilies on the altar", "# Jasmine after sunset", "# White frangipani", "# An old oak and moss", "# Clean skin"],
    },
    origin: { coords: "41.8878° N, 12.4757° E", location: { ru: "Рим, Италия", en: "Rome, Italy" } },
    releaseDate: "22 / 11 / 2026",
    heroImage: "/images/santa-caecilia/waterhouse.webp",
    gallery: [
      "/images/santa-caecilia/raphael.webp",
      "/images/santa-caecilia/reni.webp",
      "/images/santa-caecilia/dolci.webp",
      "/images/santa-caecilia/domenichino.webp",
      "/images/santa-caecilia/gentileschi.webp",
    ],
    accentColor: "#b8923a",
    accentColorDim: "rgba(184,146,58,0.35)",
    radarFill: "rgba(184,146,58,0.12)",
    keywords: { ru: "БЕЛЫЙ · ЦВЕТОЧНЫЙ · СВЯЩЕННЫЙ", en: "WHITE · FLORAL · SACRED" },
    guide: {
      plain: {
        ru: "Сад белых цветов ранним утром. Лилия, жасмин и гардения — чистые, светлые и нежные, без приторности. К вечеру под цветами проступает тёплая кожа: мягкое дерево, мускус и мох.",
        en: "A garden of white flowers early in the morning. Lily, jasmine and gardenia — clean, bright and tender, never cloying. By evening warm skin shows through the flowers: soft wood, musk and moss.",
      },
      drydown: [
        { when: { ru: "Утро · первые минуты", en: "Morning · first minutes" }, notes: "top", text: { ru: "Свежо и воздушно, как будто открыли калитку в сад после росы. Белые цветы ещё прохладные.", en: "Fresh and airy, like opening the garden gate after the dew. The white flowers are still cool." } },
        { when: { ru: "Полдень · через час", en: "Midday · after an hour" }, notes: "heart", text: { ru: "Раскрывается сердце: лилия, жасмин, гардения и франжипани. Сливочно, светло и тепло, как цветы на солнце.", en: "The heart opens: lily, jasmine, gardenia and frangipani. Creamy, bright and warm, like flowers in the sun." } },
        { when: { ru: "Вечер · до конца дня", en: "Evening · until the end of the day" }, notes: "base", text: { ru: "Цветы затихают. Остаются дерево, амбра, мускус, пачули и дубовый мох — как тень старого дуба в конце дорожки.", en: "The flowers grow quiet. What stays is wood, ambergris, musk, patchouli and oakmoss — like the shade of an old oak at the end of the path." } },
      ],
      facets: [
        { label: { ru: "Белые цветы", en: "White flowers" }, value: 95 },
        { label: { ru: "Чистота и свежесть", en: "Cleanness & freshness" }, value: 74 },
        { label: { ru: "Сливочность", en: "Creaminess" }, value: 62 },
        { label: { ru: "Мускус", en: "Musk" }, value: 55 },
        { label: { ru: "Дерево и мох", en: "Wood & moss" }, value: 46 },
        { label: { ru: "Сладость", en: "Sweetness" }, value: 28 },
      ],
      sillage: { ru: "Средний — мягкое облако вокруг вас", en: "Moderate — a soft cloud around you" },
      season: { ru: "Лучше всего весна и лето", en: "Best in spring and summer" },
      time: { ru: "День: прогулка, свадьба, тихий праздник", en: "Daytime: a walk, a wedding, a quiet celebration" },
      tip: { ru: "Нанесите на запястья и кончики волос — белые цветы лучше раскрываются в тепле.", en: "Apply to wrists and the ends of your hair — white flowers open best in warmth." },
      scenes: {
        ru: ["Лилии в монастырском саду и мокрый камень.", "Свадебный букет из белых цветов.", "Гардения в горшке на подоконнике.", "Сырой мох у старой стены."],
        en: ["Lilies in a cloister garden and wet stone.", "A wedding bouquet of white flowers.", "A potted gardenia on the windowsill.", "Damp moss by an old wall."],
      },
    },
  },
  {
    id: "almost-nothing",
    name: "almost nothing",
    emotionalPath: ["Love", "Warmth", "Silence"],
    scentNotes: {
      all: {
        ru: ["Гедион", "Iso E Super", "Мускус", "Горячее железо"],
        en: ["Hedione", "Iso E Super", "Musk", "Hot Iron"],
      },
    },
    radarAxes: [
      { key: "intimacy", label: { ru: "Близость", en: "Intimacy" }, value: 97 },
      { key: "skin", label: { ru: "Кожа", en: "Skin" }, value: 94 },
      { key: "silence", label: { ru: "Тишина", en: "Silence" }, value: 90 },
      { key: "cleanliness", label: { ru: "Чистота", en: "Cleanliness" }, value: 86 },
      { key: "warmth", label: { ru: "Тепло", en: "Warmth" }, value: 78 },
      { key: "sillage", label: { ru: "Шлейф", en: "Sillage" }, value: 12 },
    ],
    description: {
      ru: "Почти ничего. Запах кожи, которую только что поцеловали. Его слышит только тот, кто стоит очень близко.",
      en: "Almost nothing. The scent of skin that has just been kissed. Only someone standing very close can hear it.",
    },
    tagline: { ru: "Вторая кожа", en: "A second skin" },
    memoryFragments: {
      ru: ["# Горячий утюг", "# Чистая наволочка", "# Кожа после душа", "# Тёплая шея под ухом", "# Мыло на руках"],
      en: ["# A hot iron", "# A clean pillowcase", "# Skin after a shower", "# A warm neck just below the ear", "# Soap on your hands"],
    },
    origin: { coords: "0 cm", location: { ru: "Ближе, чем кажется", en: "Closer than you think" } },
    releaseDate: "2026",
    heroImage: "/images/almost-nothing/window.webp",
    gallery: [
      "/images/almost-nothing/collar.webp",
      "/images/almost-nothing/stage-morning.webp",
      "/images/almost-nothing/stage-day.webp",
      "/images/almost-nothing/stage-night.webp",
    ],
    accentColor: "#c9a08a",
    accentColorDim: "rgba(201,160,138,0.35)",
    radarFill: "rgba(201,160,138,0.12)",
    keywords: { ru: "КОЖА · МУСКУС · ТИШИНА", en: "SKIN · MUSK · SILENCE" },
    // the scent is linear (scentNotes.all); AlmostNothingWorld maps each moment of the day to its notes
    guide: {
      plain: {
        ru: "Почти не духи, а ваша собственная кожа, только чуть лучше. Тёплый горячий хлопок из-под утюга, прозрачный воздушный жасмин и чистый мускус. Сами вы его почти не слышите — его слышит тот, кто подошёл очень близко.",
        en: "Hardly a perfume at all — your own skin, only slightly better. Warm cotton straight from the iron, sheer airy jasmine and clean musk. You barely smell it yourself — the person who comes very close does.",
      },
      drydown: [
        { when: { ru: "Утро", en: "Morning" }, notes: "top", text: { ru: "Горячий утюг по свежему хлопку и прозрачный гедион. Чисто, тепло и чуть-чуть цветочно, как рубашка, которую только что погладили.", en: "A hot iron over fresh cotton and sheer hedione. Clean, warm and just a little floral, like a shirt that has just been ironed." } },
        { when: { ru: "День", en: "Day" }, notes: "heart", text: { ru: "Iso E Super растворяется в коже: мягкое бархатное дерево, которого почти не видно, только ощущение тепла вокруг вас.", en: "Iso E Super melts into the skin: a soft velvety wood you can hardly see, just a sense of warmth around you." } },
        { when: { ru: "Ночь", en: "Night" }, notes: "base", text: { ru: "Остаётся мускус — запах чистой кожи и подушки. Его можно услышать только уткнувшись носом в шею.", en: "What stays is musk — the smell of clean skin and a pillow. You can only catch it with your nose against a neck." } },
      ],
      facets: [
        { label: { ru: "Кожа и мускус", en: "Skin & musk" }, value: 94 },
        { label: { ru: "Чистый хлопок", en: "Clean cotton" }, value: 86 },
        { label: { ru: "Тепло", en: "Warmth" }, value: 78 },
        { label: { ru: "Прозрачные цветы", en: "Sheer flowers" }, value: 40 },
        { label: { ru: "Дерево", en: "Wood" }, value: 36 },
        { label: { ru: "Шлейф", en: "Sillage" }, value: 12 },
      ],
      sillage: { ru: "Очень тихий — слышно только вплотную", en: "Very quiet — only up close" },
      season: { ru: "Круглый год", en: "All year round" },
      time: { ru: "Всегда: на работу, на свидание, перед сном", en: "Any time: work, a date, before bed" },
      tip: { ru: "Нанесите на шею под ухом и на внутреннюю сторону локтя — там кожа теплее всего, и аромат раскрывается сильнее.", en: "Apply under the ear and to the inside of the elbow — the skin is warmest there and the scent opens up more." },
      scenes: {
        ru: ["Воротник рубашки, которую носили вчера.", "Тёплая кожа на шее.", "Хлопок прямо из-под утюга.", "Ванная после горячего душа."],
        en: ["The collar of a shirt worn yesterday.", "Warm skin on a neck.", "Cotton straight from the iron.", "The bathroom after a hot shower."],
      },
    },
  },
];

// Emotional map tree — 3 steps to reach a perfume
export const emotionTree: Record<string, Record<string, Record<string, string[]>>> = {
  Love: {
    Nostalgia: { Warmth: ["sunlit-memories", "summer-of-2009"], Melancholy: ["summer-of-2009"] },
    Obsession: { Euphoria: ["self-addicted"], Confidence: ["narcisstic-king"] },
    Devotion: { Peace: ["santa-caecilia", "sunlit-memories"], Warmth: ["almost-nothing", "self-addicted"] },
  },
  Isolation: {
    Silence: { Peace: ["almost-nothing", "silent-fog", "laundry-routine"], Void: ["silent-fog"] },
    Ritual: { Silence: ["seance"], Darkness: ["seance"] },
    Melancholy: { Void: ["silent-fog"], Peace: ["laundry-routine"] },
  },
  Euphoria: {
    Madness: { Obsession: ["synthetic-ecstasy"], Void: ["synthetic-ecstasy"] },
    Confidence: { Madness: ["highest-in-the-room"], Power: ["highest-in-the-room", "narcisstic-king"] },
    Passion: { Obsession: ["self-addicted"], Love: ["self-addicted"] },
  },
  Ritual: {
    Warmth: { Peace: ["russian-banya"], Silence: ["russian-banya"] },
    Silence: { Darkness: ["seance"], Void: ["seance"] },
    Devotion: { Peace: ["santa-caecilia", "russian-banya"], Warmth: ["russian-banya"] },
  },
  Nostalgia: {
    Love: { Warmth: ["summer-of-2009", "sunlit-memories"], Melancholy: ["summer-of-2009"] },
    Melancholy: { Void: ["summer-of-2009"], Tears: ["summer-of-2009"] },
    Peace: { Silence: ["laundry-routine"], Warmth: ["sunlit-memories"] },
  },
  Obsession: {
    Madness: { Void: ["synthetic-ecstasy"], Euphoria: ["synthetic-ecstasy", "highest-in-the-room"] },
    Confidence: { Love: ["narcisstic-king"], Power: ["narcisstic-king"] },
    Love: { Euphoria: ["self-addicted"], Devotion: ["self-addicted"] },
  },
  Warmth: {
    Peace: { Silence: ["laundry-routine", "russian-banya"], Ritual: ["russian-banya"] },
    Love: { Nostalgia: ["sunlit-memories", "summer-of-2009"], Devotion: ["almost-nothing", "self-addicted"] },
    Ritual: { Warmth: ["russian-banya"], Peace: ["russian-banya"] },
  },
  Fear: {
    Isolation: { Silence: ["silent-fog"], Void: ["silent-fog"] },
    Ritual: { Darkness: ["seance"], Silence: ["seance"] },
    Melancholy: { Void: ["silent-fog"], Tears: ["summer-of-2009"] },
  },
};

export const step1Emotions = Object.keys(emotionTree);
export function getStep2Emotions(step1: string): string[] { return Object.keys(emotionTree[step1] || {}); }
export function getStep3Emotions(step1: string, step2: string): string[] { return Object.keys(emotionTree[step1]?.[step2] || {}); }
export function getResultPerfumes(step1: string, step2: string, step3: string): string[] { return emotionTree[step1]?.[step2]?.[step3] || []; }
export function getPerfumeById(id: string): Perfume | undefined { return perfumes.find((p) => p.id === id); }
