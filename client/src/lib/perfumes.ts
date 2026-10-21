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
      ru: ["# Пламя свечи", "# Пение в темноте", "# Холодный камень под ногами", "# Запах старых церквей", "# Присутствие за спиной"],
      en: ["# The candle flame", "# Chanting in the dark", "# Cold stone under feet", "# The smell of old churches", "# A presence behind you"],
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
      ru: ["# Бег босиком по мокрой траве", "# Солнце сквозь открытые окна", "# Запах дождя на листьях", "# Смех вдалеке", "# Лето, которое никогда не кончалось"],
      en: ["# Running barefoot on wet grass", "# Sunlight through open windows", "# The smell of rain on leaves", "# Laughter in the distance", "# A summer that never ended"],
    },
    origin: { coords: "45.4654° N, 9.1900° E", location: { ru: "Озеро Комо, Италия", en: "Lake Como, Italy" } },
    releaseDate: "18 / 06 / 2023",
    heroImage: "https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/hero-sunlit-memories-F2Zmzs7Zqjb9Ybd3PBPt9E.webp",
    accentColor: "#8a9a6a",
    accentColorDim: "rgba(138,154,106,0.35)",
    radarFill: "rgba(138,154,106,0.12)",
    keywords: { ru: "ЗЕЛЁНЫЙ · ЧИСТЫЙ · ПРОЗРАЧНЫЙ", en: "GREEN · CLEAN · TRANSPARENT" },
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
      ru: ["# Шаг в жару", "# Ледяная вода на коже", "# Смех и тишина", "# Запах мокрого дерева", "# Момент, чтобы дышать"],
      en: ["# Stepping into the heat", "# Ice water on the skin", "# Laughter and quiet", "# The smell of wet wood", "# A moment to breathe"],
    },
    origin: { coords: "60.1020° N, 30.3155° E", location: { ru: "Россия", en: "Russia" } },
    releaseDate: "01 / 12 / 2023",
    heroImage: "/images/russian-banya/hero.png",
    gallery: [
      "/images/russian-banya/cabin.png",
      "/images/russian-banya/steam.png",
      "/images/russian-banya/basin.png",
      "/images/russian-banya/venik.png",
    ],
    accentColor: "#7a9a5a",
    accentColorDim: "rgba(122,154,90,0.35)",
    radarFill: "rgba(122,154,90,0.12)",
    keywords: { ru: "СЫРОЙ · ПРИРОДНЫЙ · ПОГРУЖАЮЩИЙ", en: "RAW · NATURAL · IMMERSIVE" },
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
      ru: ["# Свежие простыни в солнечный день", "# Щелчок стиральной машины", "# Холодная вода на руках", "# Запах чистого хлопка", "# Открытые окна, движущиеся занавески"],
      en: ["# Fresh sheets on a sunny day", "# The click of the washing machine", "# Cold water on your hands", "# The smell of clean cotton", "# Windows open, curtains moving"],
    },
    origin: { coords: "43.6532° N, 79.3832° W", location: { ru: "Торонто, Канада", en: "Toronto, Canada" } },
    releaseDate: "12 / 04 / 2024",
    heroImage: "https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/hero-laundry-routine-d3dhbaUrDUuDaJfQBZESq3.webp",
    accentColor: "#8a9aaa",
    accentColorDim: "rgba(138,154,170,0.35)",
    radarFill: "rgba(138,154,170,0.12)",
    keywords: { ru: "ЧИСТЫЙ · МИНИМАЛЬНЫЙ · БЕЗУПРЕЧНЫЙ", en: "CLEAN · MINIMAL · PURE" },
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
      ru: ["# Неоновые огни на мокром асфальте", "# Вкус чего-то ненастоящего", "# Поздние ночи, пустые комнаты", "# Ты не знаешь, что реально", "# Но это так хорошо"],
      en: ["# Neon lights on wet asphalt", "# The taste of something fake", "# Late nights, empty rooms", "# You don't know what is real", "# But it feels so good"],
    },
    origin: { coords: "35.6895° N, 139.6917° E", location: { ru: "Токио, Япония", en: "Tokyo, Japan" } },
    releaseDate: "22 / 11 / 2023",
    heroImage: "https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/hero-synthetic-ecstasy-kiFN5HSLZZpD3GEV9brzh3.webp",
    accentColor: "#c4507a",
    accentColorDim: "rgba(196,80,122,0.35)",
    radarFill: "rgba(196,80,122,0.12)",
    keywords: { ru: "СИНТЕТИЧЕСКИЙ · СЮРРЕАЛЬНЫЙ · АДДИКТИВНЫЙ", en: "SYNTHETIC · SURREAL · ADDICTIVE" },
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
      ru: ["# Огни города внизу", "# Дым в воздухе", "# Бас в груди", "# Никто не может достать тебя", "# Ты не спускаешься"],
      en: ["# City lights below", "# Smoke in the air", "# Bass in your chest", "# Nobody can reach you", "# You're not coming down"],
    },
    origin: { coords: "34.0522° N, 118.2437° W", location: { ru: "Лос-Анджелес, США", en: "Los Angeles, USA" } },
    releaseDate: "21 / 09 / 2023",
    heroImage: "https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/hero-highest-in-room-SVWJW6YL4H7mgSDQ8q7KKr.webp",
    accentColor: "#c9a96e",
    accentColorDim: "rgba(201,169,110,0.35)",
    radarFill: "rgba(201,169,110,0.12)",
    keywords: { ru: "СЫРОЙ · РОСКОШНЫЙ · АДДИКТИВНЫЙ", en: "RAW · LUXURIOUS · ADDICTIVE" },
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
      ru: ["# Утро после дождя", "# Пустые улицы, мокрый асфальт", "# Дыхание в холоде", "# Мысль, которая исчезает", "# Наблюдение за миром из-за окна"],
      en: ["# The morning after rain", "# Empty streets, wet asphalt", "# Breathing in the cold", "# A thought that fades", "# Watching the world from behind the window"],
    },
    origin: { coords: "54.5186° N, 37.5665° E", location: { ru: "Россия", en: "Russia" } },
    releaseDate: "22 / 08 / 2023",
    heroImage: "/images/silent-fog/hero.png",
    gallery: [
      "/images/silent-fog/water.png",
      "/images/silent-fog/mist.png",
      "/images/silent-fog/hand.png",
      "/images/silent-fog/levitate.png",
    ],
    accentColor: "#7a8a8a",
    accentColorDim: "rgba(122,138,138,0.35)",
    radarFill: "rgba(122,138,138,0.12)",
    keywords: { ru: "СЫРОЙ · ВОДНЫЙ · ПОЛУПРОЗРАЧНЫЙ", en: "RAW · AQUEOUS · TRANSLUCENT" },
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
      ru: ["# Тяжесть короны", "# Бархат и дым", "# Украденный поцелуй в темноте", "# Кровь на шёлке", "# Момент, когда тебя назвали королём"],
      en: ["# The weight of a crown", "# Velvet and smoke", "# A stolen kiss in the dark", "# Blood on silk", "# The moment they called you king"],
    },
    origin: { coords: "51.5074° N, 0.1278° W", location: { ru: "Лондон, Великобритания", en: "London, UK" } },
    releaseDate: "07 / 11 / 2023",
    heroImage: "https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/hero-narcisstic-king-TGCKoeVhq48EcaY2wC8RrU.webp",
    accentColor: "#c9a96e",
    accentColorDim: "rgba(201,169,110,0.35)",
    radarFill: "rgba(201,169,110,0.12)",
    keywords: { ru: "СЫРОЙ · РОСКОШНЫЙ · ДОМИНИРУЮЩИЙ", en: "RAW · OPULENT · DOMINANT" },
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
      ru: ["# Ночные признания", "# Духи на подушке", "# Сообщения, которые не стоило читать", "# Поцелуи со вкусом ванили", "# Обещания в прокуренной комнате"],
      en: ["# Late night confessions", "# Perfume on the pillow", "# Messages you shouldn't read", "# Kisses that taste like vanilla", "# Promises in a smoke-filled room"],
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
      ru: ["# Дача в деревне", "# Конец июля", "# Варенье из ежевики", "# Светлячки в сумерках", "# Ощущение, что вот-вот заплачешь"],
      en: ["# Dacha in the countryside", "# Late July", "# Blackberry jam", "# Fireflies at dusk", "# The feeling of almost crying"],
    },
    origin: { coords: "55.5827° N, 39.1285° E", location: { ru: "Россия", en: "Russia" } },
    releaseDate: "01 / 10 / 2023",
    heroImage: "/images/summer-of-2009/hero-berries.png",
    gallery: [
      "/images/summer-of-2009/photo-children.png",
      "/images/summer-of-2009/path.png",
      "/images/summer-of-2009/bike.png",
      "/images/summer-of-2009/jar.png",
    ],
    accentColor: "#7a9a5a",
    accentColorDim: "rgba(122,154,90,0.35)",
    radarFill: "rgba(122,154,90,0.12)",
    keywords: { ru: "СЫРОЙ · ПРИРОДНЫЙ · НЕФИЛЬТРОВАННЫЙ", en: "RAW · NATURAL · UNFILTERED" },
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
      ru: ["# Лилии на алтаре", "# Орган под каменными сводами", "# Белая ткань на холодном мраморе", "# Свет из высокого окна", "# Тишина после последней ноты"],
      en: ["# Lilies on the altar", "# An organ under stone vaults", "# White cloth on cold marble", "# Light from a high window", "# The silence after the last note"],
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
      ru: ["# Утро в чужой рубашке", "# Тёплая шея под ухом", "# Только что выглаженный хлопок", "# Кожа после душа", "# Шёпот, а не голос"],
      en: ["# Morning in someone else's shirt", "# A warm neck just below the ear", "# Freshly ironed cotton", "# Skin after a shower", "# A whisper, not a voice"],
    },
    origin: { coords: "0 cm", location: { ru: "Ближе, чем кажется", en: "Closer than you think" } },
    releaseDate: "2026",
    heroImage: "/images/almost-nothing/skin.webp",
    accentColor: "#c9a08a",
    accentColorDim: "rgba(201,160,138,0.35)",
    radarFill: "rgba(201,160,138,0.12)",
    keywords: { ru: "КОЖА · МУСКУС · ТИШИНА", en: "SKIN · MUSK · SILENCE" },
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
