// Dev-only sample (loaded with /layering?demo) to review the recipe layout without calling the model.
export const DEMO_RESULT: import("./Layering").LayeringResult = {
  intro: "Полка человека, который днём носит дым, а ночью — сахар: вы собираете контрасты и не боитесь, что они заметны.",
  combos: [
    {
      title: "Горящий сахар", idea: "Мост через ваниль и табак: два тёплых аромата сливаются в один густой.",
      perfumes: [{ name: "Tobacco Oud", role: "base", sprays: 2, where: "запястья" }, { name: "Baccarat Rouge 540", role: "top", sprays: 1, where: "шея" }],
      application: "Табак на запястья, подождать минуту, сверху один пшик Baccarat на шею.", result: "Первые полчаса — жжёный сахар и смола, потом остаётся тёплая древесина с янтарным свечением.",
      mood: "Уверенный, вечерний", occasion: "Ужин, бар", season: "Осень — зима", why: "Амбра Baccarat подхватывает сладость табака и делает его прозрачнее.", intensity: 4,
    },
    {
      title: "Свеча в пустом храме", idea: "Контраст: тёмный ладан и холодный минеральный верх.",
      perfumes: [{ name: "Seance", role: "base", sprays: 2, where: "грудь" }, { name: "Мой секретный аромат", role: "top", sprays: 1, where: "шарф" }],
      application: "Seance на кожу, свежий аромат — на ткань, чтобы не спорили напрямую.", result: "Дым звучит тише, как будто его слышно через стену.",
      mood: "Тихий, отстранённый", occasion: "Музей, прогулка", season: "Межсезонье", why: "Ткань держит верх отдельно, кожа греет базу — слои не смешиваются в кашу.", intensity: 2,
    },
  ],
  silentium: { id: "silent-fog", title: "Дым, который рассеивается", pairWith: "Tobacco Oud", application: "Два пшика Tobacco Oud, сверху один Silent Fog.", result: "Табак становится влажным и холодным, как утро после костра.", why: "Вашей полке не хватает воздуха — Silent Fog добавляет озон и дождь поверх плотных баз." },
};
