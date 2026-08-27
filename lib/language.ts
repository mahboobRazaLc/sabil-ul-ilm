const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const URDU_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasArabicOrUrdu(text: string): boolean {
  return ARABIC_RANGE.test(text);
}

export function getLanguageClass(text: string): string {
  if (!text) return "";
  if (hasArabicOrUrdu(text)) {
    return "lang-ur";
  }
  return "";
}
