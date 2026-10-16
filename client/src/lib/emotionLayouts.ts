// Emotion descriptions shown in the nebula map's hover panel

export interface EmotionMeta {
  score: number;
  description: { ru: string; en: string };
  hint?: { ru: string; en: string };
}

export const EMOTION_META: Record<string, EmotionMeta> = {
  Love: { score: 88, description: { ru: "Тепло, от которого невозможно отвернуться.", en: "Warmth you cannot turn away from." }, hint: { ru: "сердце открыто", en: "the heart laid bare" } },
  Isolation: { score: 76, description: { ru: "Пространство между вами и миром.", en: "The space between you and the world." }, hint: { ru: "тишина вокруг", en: "silence all around" } },
  Euphoria: { score: 91, description: { ru: "Вспышка, которая сжигает границы.", en: "A flash that burns through limits." }, hint: { ru: "всё возможно", en: "everything is possible" } },
  Ritual: { score: 84, description: { ru: "Повторение, дающее смысл.", en: "Repetition that gives meaning." }, hint: { ru: "священный порядок", en: "sacred order" } },
  Nostalgia: { score: 92, description: { ru: "Боль прекрасных воспоминаний.", en: "The ache of beautiful memories." }, hint: { ru: "то, что было", en: "memories of what was" } },
  Obsession: { score: 89, description: { ru: "Мысль, которую нельзя отпустить.", en: "A thought you cannot release." }, hint: { ru: "петля без выхода", en: "a loop with no exit" } },
  Warmth: { score: 81, description: { ru: "Мягкий свет внутри холода.", en: "Soft light inside the cold." }, hint: { ru: "близость кожи", en: "closeness of skin" } },
  Fear: { score: 74, description: { ru: "Тень, следующая за каждым шагом.", en: "A shadow following every step." }, hint: { ru: "что-то за спиной", en: "something behind you" } },
  Silence: { score: 86, description: { ru: "Пустота, которая говорит громче слов.", en: "Emptiness louder than words." }, hint: { ru: "ничего не сказано", en: "nothing spoken" } },
  Peace: { score: 83, description: { ru: "Покой внутри связи.", en: "The calm within connection." }, hint: { ru: "дыхание выровнялось", en: "breath finally even" } },
  Madness: { score: 90, description: { ru: "Край, где ломается разум.", en: "The edge where reason breaks." }, hint: { ru: "слишком много", en: "too much at once" } },
  Confidence: { score: 87, description: { ru: "Взгляд, который не отводят.", en: "A gaze that never wavers." }, hint: { ru: "выше всех", en: "above them all" } },
  Passion: { score: 85, description: { ru: "Огонь, пожирающий осторожность.", en: "Fire that devours caution." }, hint: { ru: "не остановить", en: "cannot be stopped" } },
  Melancholy: { score: 78, description: { ru: "Сладкая грусть без причины.", en: "Sweet sorrow without reason." }, hint: { ru: "синий час", en: "the blue hour" } },
  Devotion: { score: 86, description: { ru: "Отдача без остатка.", en: "Giving without remainder." }, hint: { ru: "всё для тебя", en: "all for you" } },
  Darkness: { score: 80, description: { ru: "Там, где свет не доходит.", en: "Where light cannot reach." }, hint: { ru: "глубже ночи", en: "deeper than night" } },
  Void: { score: 77, description: { ru: "Абсолютная пустота.", en: "Absolute emptiness." }, hint: { ru: "ничего нет", en: "there is nothing" } },
  Tears: { score: 75, description: { ru: "Соль на коже.", en: "Salt on the skin." }, hint: { ru: "выплакано", en: "finally cried out" } },
  Power: { score: 93, description: { ru: "Власть как второй запах.", en: "Power as a second scent." }, hint: { ru: "они смотрят", en: "they are watching" } },
  Longing: { score: 82, description: { ru: "Дистанция, которая жжёт.", en: "Distance that burns." }, hint: { ru: "ещё не рядом", en: "not yet close" } },
  Heartbreak: { score: 88, description: { ru: "Трещины, которые не заживают.", en: "Fractures we don't heal from." }, hint: { ru: "осталось внутри", en: "it stayed inside" } },
  Vulnerability: { score: 79, description: { ru: "Кожа без брони.", en: "Skin without armor." }, hint: { ru: "видно всё", en: "everything visible" } },
  Affection: { score: 80, description: { ru: "Нежность без слов.", en: "Tenderness without words." }, hint: { ru: "лёгкое касание", en: "a light touch" } },
  Tenderness: { score: 77, description: { ru: "Мягкость, которой боятся.", en: "Softness we fear." }, hint: { ru: "бережно", en: "handled with care" } },
};
