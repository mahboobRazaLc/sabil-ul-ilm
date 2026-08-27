export const CLASS_NAMES: Record<string, { en: string; ar: string }> = {
  edadiya: { en: "Edadiya", ar: "اعدادیہ" },
  ula: { en: "Ula", ar: "اولیٰ" },
  saniya: { en: "Saniya", ar: "ثانیہ" },
  salisa: { en: "Salisa", ar: "ثالثہ" },
  rabia: { en: "Rabia", ar: "رابعہ" },
  fazilat: { en: "Fazilat", ar: "فضیloit" },
};

export const SUBJECT_NAMES: Record<string, { en: string; ar: string }> = {
  nahw: { en: "Nahw", ar: "نحو" },
  sarf: { en: "Sarf", ar: "صرف" },
  fiqh: { en: "Fiqh", ar: "فقہ" },
  mantiq: { en: "Mantiq", ar: "منطق" },
  tafsir: { en: "Tafsir", ar: "تفسیر" },
  hadith: { en: "Hadith", ar: "حدیث" },
  seerah: { en: "Seerah", ar: "سیرت" },
  akhlaq: { en: "Akhlaq", ar: "اخلاق" },
};

export function getClassDisplayName(slug: string, fallback: string): { en: string; ar: string | null } {
  const names = CLASS_NAMES[slug];
  return names ? { en: names.en, ar: names.ar } : { en: fallback, ar: null };
}

export function getSubjectDisplayName(slug: string, fallback: string): { en: string; ar: string | null } {
  const names = SUBJECT_NAMES[slug];
  return names ? { en: names.en, ar: names.ar } : { en: fallback, ar: null };
}
