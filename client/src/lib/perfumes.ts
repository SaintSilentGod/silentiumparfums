// Silentium — Perfume Data
// Design: Void Romanticism — dark canvas, gold accents, emotional star-chart navigation

export interface Perfume {
  id: string;
  name: string;
  emotionalPath: string[];
  scentNotes: {
    top?: { ru: string[]; en: string[] };
    heart?: { ru: string[]; en: string[] };
    base?: { ru: string[]; en: string[] };
    all?: { ru: string[]; en: string[] };
  };
  emotionalProfile: {
    love: number;
    isolation: number;
    melancholy: number;
    memoryClarity: number;
    warmth: number;
  };
  description: { ru: string; en: string };
  tagline: { ru: string; en: string };
}

export const perfumes: Perfume[] = [
  {
    id: "seance",
    name: "Seance",
    emotionalPath: ["Isolation", "Ritual", "Silence"],
    scentNotes: {
      top: {
        ru: ["Горный воздух", "Водные ноты", "Альдегиды", "Бергамот"],
        en: ["Mountain Air", "Water Notes", "Aldehydes", "Bergamot"],
      },
      heart: {
        ru: ["Ладан", "Дымные ноты", "Бальзамические ноты", "Смолы", "Бумага"],
        en: ["Incense", "Smoky Notes", "Balsamic Notes", "Resins", "Paper"],
      },
      base: {
        ru: ["Березовый деготь", "Сандал", "Древесные ноты"],
        en: ["Birch Tar", "Sandalwood", "Woody Notes"],
      },
    },
    emotionalProfile: { love: 10, isolation: 90, melancholy: 60, memoryClarity: 40, warmth: 20 },
    description: {
      ru: "Тишина пустой комнаты. Запах старых страниц и дыма. Ожидание ответа, который может никогда не прийти.",
      en: "The silence of an empty room. The smell of old pages and smoke. Waiting for an answer that may never come.",
    },
    tagline: { ru: "Голос из пустоты", en: "A voice from the void" },
  },
  {
    id: "sunlit-memories",
    name: "Sunlit Memories",
    emotionalPath: ["Love", "Nostalgia", "Warmth"],
    scentNotes: {
      top: {
        ru: ["Листья Ежевики", "Мята"],
        en: ["Blackberry Leaves", "Mint"],
      },
      heart: {
        ru: ["Ноты дождя", "Зеленые ноты", "Нероли", "Жасмин"],
        en: ["Rain Notes", "Green Notes", "Neroli", "Jasmine"],
      },
      base: {
        ru: ["Древесные ноты", "Белый мускус"],
        en: ["Woody Notes", "White Musk"],
      },
    },
    emotionalProfile: { love: 85, isolation: 15, melancholy: 50, memoryClarity: 90, warmth: 75 },
    description: {
      ru: "Летний день, который остался в памяти навсегда. Свет сквозь листья, запах дождя на теплой земле. Момент чистого счастья.",
      en: "A summer day that remained in memory forever. Light through the leaves, the smell of rain on warm earth. A moment of pure happiness.",
    },
    tagline: { ru: "Свет, который не гаснет", en: "Light that never fades" },
  },
  {
    id: "russian-banya",
    name: "Russian Banya",
    emotionalPath: ["Ritual", "Warmth", "Peace"],
    scentNotes: {
      top: {
        ru: ["Пихта", "Сено", "Эвкалипт", "Лайм", "Мята"],
        en: ["Fir", "Hay", "Eucalyptus", "Lime", "Mint"],
      },
      heart: {
        ru: ["Кардамон", "Каннабис", "Смолы", "Дубовый мох", "Можжевельник", "Дымные ноты"],
        en: ["Cardamom", "Cannabis", "Resins", "Oakmoss", "Juniper", "Smoky Notes"],
      },
      base: {
        ru: ["Сандал", "Цитрусовые ноты", "Древесные ноты", "Бальзамические ноты", "Ваниль", "Дерево махагони", "Кедр"],
        en: ["Sandalwood", "Citrus Notes", "Woody Notes", "Balsamic Notes", "Vanilla", "Mahogany", "Cedar"],
      },
    },
    emotionalProfile: { love: 40, isolation: 30, melancholy: 10, memoryClarity: 70, warmth: 95 },
    description: {
      ru: "Жар, очищающий разум. Запах хвои и раскаленных камней. Глубокий вдох, возвращающий к истокам.",
      en: "Heat that clears the mind. The smell of pine needles and hot stones. A deep breath returning to the roots.",
    },
    tagline: { ru: "Очищение огнём", en: "Purified by fire" },
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
    emotionalProfile: { love: 30, isolation: 50, melancholy: 20, memoryClarity: 80, warmth: 40 },
    description: {
      ru: "Простые движения, приносящие покой. Запах чистоты и холодного воздуха. Повседневность как медитация.",
      en: "Simple movements bringing peace. The smell of cleanliness and cold air. Everyday life as meditation.",
    },
    tagline: { ru: "Покой в простом", en: "Peace in the ordinary" },
  },
  {
    id: "synthetic-ecstasy",
    name: "synthetic ecstasy",
    emotionalPath: ["Euphoria", "Madness", "Obsession"],
    scentNotes: {
      top: {
        ru: ["Пластик", "Альдегиды", "Лед", "Клубника"],
        en: ["Plastic", "Aldehydes", "Ice", "Strawberry"],
      },
      heart: {
        ru: ["Винил", "Лак для ногтей", "Белый мускус"],
        en: ["Vinyl", "Nail Polish", "White Musk"],
      },
      base: {
        ru: ["Ваниль", "Корень ириса", "Амбер", "Кашмеран", "Озоновые ноты"],
        en: ["Vanilla", "Orris Root", "Amber", "Cashmeran", "Ozone Notes"],
      },
    },
    emotionalProfile: { love: 60, isolation: 10, melancholy: 5, memoryClarity: 20, warmth: 50 },
    description: {
      ru: "Искусственный свет неона. Сладкий, токсичный аромат ночи. Чувство, что все возможно прямо сейчас.",
      en: "Artificial neon light. Sweet, toxic scent of the night. The feeling that everything is possible right now.",
    },
    tagline: { ru: "Сладкий яд настоящего", en: "Sweet poison of the now" },
  },
  {
    id: "highest-in-the-room",
    name: "Highest in the room",
    emotionalPath: ["Euphoria", "Confidence", "Madness"],
    scentNotes: {
      top: {
        ru: ["Каннабис", "Розовый перец", "Шафран"],
        en: ["Cannabis", "Pink Pepper", "Saffron"],
      },
      heart: {
        ru: ["Франжипани", "Ирис", "Замша", "Шафран", "Мускус"],
        en: ["Frangipani", "Iris", "Suede", "Saffron", "Musk"],
      },
      base: {
        ru: ["Патчули", "Сандал", "Кашмеран", "Сухая древесина", "Дубовый мох"],
        en: ["Patchouli", "Sandalwood", "Cashmeran", "Dry Wood", "Oakmoss"],
      },
    },
    emotionalProfile: { love: 50, isolation: 20, melancholy: 10, memoryClarity: 30, warmth: 60 },
    description: {
      ru: "Взгляд сверху вниз. Плотный дым и дорогая замша. Уверенность, граничащая с безрассудством.",
      en: "Looking down from above. Dense smoke and expensive suede. Confidence bordering on recklessness.",
    },
    tagline: { ru: "Выше всех в комнате", en: "Highest in the room" },
  },
  {
    id: "silent-fog",
    name: "Silent Fog",
    emotionalPath: ["Isolation", "Silence", "Peace"],
    scentNotes: {
      top: {
        ru: ["Озоновые ноты", "Альдегиды", "Ноты дождя", "Мята"],
        en: ["Ozone Notes", "Aldehydes", "Rain Notes", "Mint"],
      },
      heart: {
        ru: ["Iso-e-super", "Горный воздух", "Бальзамические ноты", "Корень ириса", "Кашмеран"],
        en: ["Iso E Super", "Mountain Air", "Balsamic Notes", "Orris Root", "Cashmeran"],
      },
      base: {
        ru: ["Сухая древесина", "Белый мускус", "Дубовый мох", "Березовый деготь"],
        en: ["Dry Wood", "White Musk", "Oakmoss", "Birch Tar"],
      },
    },
    emotionalProfile: { love: 10, isolation: 95, melancholy: 70, memoryClarity: 20, warmth: 10 },
    description: {
      ru: "Белая пелена, скрывающая мир. Холод, проникающий под кожу. Идеальное укрытие от всего.",
      en: "A white veil hiding the world. Cold penetrating under the skin. A perfect hideout from everything.",
    },
    tagline: { ru: "Там, где тебя не найдут", en: "Where they won't find you" },
  },
  {
    id: "narcisstic-king",
    name: "narcisstic king",
    emotionalPath: ["Obsession", "Confidence", "Love"],
    scentNotes: {
      top: {
        ru: ["Малина", "Ежевика", "Розовый перец"],
        en: ["Raspberry", "Blackberry", "Pink Pepper"],
      },
      heart: {
        ru: ["Шафран", "Роза", "Ямайский перец", "Жасмин"],
        en: ["Saffron", "Rose", "Jamaican Pepper", "Jasmine"],
      },
      base: {
        ru: ["Кожа", "Уд", "Табак", "Патчули", "Дубовый мох", "Ваниль", "Мускус", "Ирис", "Амбер"],
        en: ["Leather", "Oud", "Tobacco", "Patchouli", "Oakmoss", "Vanilla", "Musk", "Iris", "Amber"],
      },
    },
    emotionalProfile: { love: 70, isolation: 40, melancholy: 30, memoryClarity: 60, warmth: 80 },
    description: {
      ru: "Корона из золота и шипов. Тяжелый взгляд. Запах власти, кожи и сладкой крови.",
      en: "A crown of gold and thorns. A heavy gaze. The smell of power, leather, and sweet blood.",
    },
    tagline: { ru: "Власть — это аромат", en: "Power is a scent" },
  },
  {
    id: "self-addicted",
    name: "Self addicted",
    emotionalPath: ["Love", "Obsession", "Euphoria"],
    scentNotes: {
      top: {
        ru: ["Дамасская роза", "Нероли", "Франжипани", "Гардения", "Розовый перец"],
        en: ["Damask Rose", "Neroli", "Frangipani", "Gardenia", "Pink Pepper"],
      },
      heart: {
        ru: ["Корица", "Гедион"],
        en: ["Cinnamon", "Hedione"],
      },
      base: {
        ru: ["Ваниль", "Бобы тонка", "Карамель", "Кашмеран", "Кедр", "Сандал", "Амбра", "Табак", "Перуанский бальзам"],
        en: ["Vanilla", "Tonka Bean", "Caramel", "Cashmeran", "Cedar", "Sandalwood", "Amber", "Tobacco", "Peru Balsam"],
      },
    },
    emotionalProfile: { love: 90, isolation: 50, melancholy: 20, memoryClarity: 50, warmth: 85 },
    description: {
      ru: "Отражение, от которого невозможно оторваться. Сладкий яд самовлюбленности. Идеальная зависимость.",
      en: "A reflection you can't look away from. The sweet poison of narcissism. A perfect addiction.",
    },
    tagline: { ru: "Влюблён в себя навсегда", en: "In love with yourself forever" },
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
    emotionalProfile: { love: 75, isolation: 20, melancholy: 65, memoryClarity: 85, warmth: 70 },
    description: {
      ru: "Воздух густой от влажности. Листья черной смородины пачкают пальцы. Старые песни из треснувшего динамика. Все кажется бесконечным.",
      en: "The air is thick with humidity. Blackcurrant leaves stain your fingers. Old songs on a cracked speaker. Everything feels infinite.",
    },
    tagline: { ru: "Лето, которое не кончается", en: "The summer that never ended" },
  },
];

// Emotional map tree — 3 steps to reach a perfume
// Step 1 → Step 2 → Step 3 → perfume(s)
export const emotionTree: Record<string, Record<string, Record<string, string[]>>> = {
  Love: {
    Nostalgia: {
      Warmth: ["sunlit-memories", "summer-of-2009"],
      Melancholy: ["summer-of-2009"],
    },
    Obsession: {
      Euphoria: ["self-addicted"],
      Confidence: ["narcisstic-king"],
    },
    Devotion: {
      Peace: ["sunlit-memories"],
      Warmth: ["self-addicted"],
    },
  },
  Isolation: {
    Silence: {
      Peace: ["silent-fog", "laundry-routine"],
      Void: ["silent-fog"],
    },
    Ritual: {
      Silence: ["seance"],
      Darkness: ["seance"],
    },
    Melancholy: {
      Void: ["silent-fog"],
      Peace: ["laundry-routine"],
    },
  },
  Euphoria: {
    Madness: {
      Obsession: ["synthetic-ecstasy"],
      Void: ["synthetic-ecstasy"],
    },
    Confidence: {
      Madness: ["highest-in-the-room"],
      Power: ["highest-in-the-room", "narcisstic-king"],
    },
    Passion: {
      Obsession: ["self-addicted"],
      Love: ["self-addicted"],
    },
  },
  Ritual: {
    Warmth: {
      Peace: ["russian-banya"],
      Silence: ["russian-banya"],
    },
    Silence: {
      Darkness: ["seance"],
      Void: ["seance"],
    },
    Devotion: {
      Peace: ["russian-banya"],
      Warmth: ["russian-banya"],
    },
  },
  Nostalgia: {
    Love: {
      Warmth: ["summer-of-2009", "sunlit-memories"],
      Melancholy: ["summer-of-2009"],
    },
    Melancholy: {
      Void: ["summer-of-2009"],
      Tears: ["summer-of-2009"],
    },
    Peace: {
      Silence: ["laundry-routine"],
      Warmth: ["sunlit-memories"],
    },
  },
  Obsession: {
    Madness: {
      Void: ["synthetic-ecstasy"],
      Euphoria: ["synthetic-ecstasy", "highest-in-the-room"],
    },
    Confidence: {
      Love: ["narcisstic-king"],
      Power: ["narcisstic-king"],
    },
    Love: {
      Euphoria: ["self-addicted"],
      Devotion: ["self-addicted"],
    },
  },
  Warmth: {
    Peace: {
      Silence: ["laundry-routine", "russian-banya"],
      Ritual: ["russian-banya"],
    },
    Love: {
      Nostalgia: ["sunlit-memories", "summer-of-2009"],
      Devotion: ["self-addicted"],
    },
    Ritual: {
      Warmth: ["russian-banya"],
      Peace: ["russian-banya"],
    },
  },
  Fear: {
    Isolation: {
      Silence: ["silent-fog"],
      Void: ["silent-fog"],
    },
    Ritual: {
      Darkness: ["seance"],
      Silence: ["seance"],
    },
    Melancholy: {
      Void: ["silent-fog"],
      Tears: ["summer-of-2009"],
    },
  },
};

export const step1Emotions = Object.keys(emotionTree);

export function getStep2Emotions(step1: string): string[] {
  return Object.keys(emotionTree[step1] || {});
}

export function getStep3Emotions(step1: string, step2: string): string[] {
  return Object.keys(emotionTree[step1]?.[step2] || {});
}

export function getResultPerfumes(step1: string, step2: string, step3: string): string[] {
  return emotionTree[step1]?.[step2]?.[step3] || [];
}

export function getPerfumeById(id: string): Perfume | undefined {
  return perfumes.find((p) => p.id === id);
}
