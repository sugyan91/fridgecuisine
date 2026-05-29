import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = {
  code: string; // ISO-ish, e.g. "en", "es", "zh-CN"
  name: string; // English name sent to the AI, e.g. "Spanish"
  native: string; // What to show in the picker, e.g. "Español"
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "hu", name: "Hungarian", native: "Magyar" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "my", name: "Burmese", native: "မြန်မာဘာသာ" },
  { code: "km", name: "Khmer", native: "ភាសាខ្មែរ" },
  { code: "lo", name: "Lao", native: "ລາວ" },
  { code: "tl", name: "Filipino", native: "Filipino" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "简体中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文" },
  { code: "mn", name: "Mongolian", native: "Монгол" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "si", name: "Sinhala", native: "සිංහල" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
  { code: "sq", name: "Albanian", native: "Shqip" },
  { code: "hr", name: "Croatian", native: "Hrvatski" },
  { code: "sr", name: "Serbian", native: "Српски" },
  { code: "sl", name: "Slovenian", native: "Slovenščina" },
  { code: "sk", name: "Slovak", native: "Slovenčina" },
  { code: "bg", name: "Bulgarian", native: "Български" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių" },
  { code: "lv", name: "Latvian", native: "Latviešu" },
  { code: "et", name: "Estonian", native: "Eesti" },
  { code: "is", name: "Icelandic", native: "Íslenska" },
  { code: "ca", name: "Catalan", native: "Català" },
  { code: "ka", name: "Georgian", native: "ქართული" },
  { code: "hy", name: "Armenian", native: "Հայերեն" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan" },
  { code: "kk", name: "Kazakh", native: "Қазақша" },
  { code: "uz", name: "Uzbek", native: "O‘zbek" },
];

/** Allow-list of language names accepted by the server. */
export const SUPPORTED_LANGUAGE_NAMES = LANGUAGES.map((l) => l.name);

const STORAGE_KEY = "fc.lang";
const DEFAULT: Language = LANGUAGES[0];

type Ctx = {
  language: Language;
  setLanguage: (code: string) => void;
};

const LanguageContext = createContext<Ctx>({
  language: DEFAULT,
  setLanguage: () => {},
});

function detectInitial(): Language {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = LANGUAGES.find((l) => l.code === stored);
      if (found) return found;
    }
    const nav = window.navigator?.language ?? "";
    if (nav) {
      const exact = LANGUAGES.find((l) => l.code.toLowerCase() === nav.toLowerCase());
      if (exact) return exact;
      const base = nav.split("-")[0].toLowerCase();
      const partial = LANGUAGES.find((l) => l.code.toLowerCase().startsWith(base));
      if (partial) return partial;
    }
  } catch {}
  return DEFAULT;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT);

  // Detect on client after mount to avoid SSR/client mismatch.
  useEffect(() => {
    setLanguageState(detectInitial());
  }, []);

  const setLanguage = (code: string) => {
    const next = LANGUAGES.find((l) => l.code === code);
    if (!next) return;
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Prompt fragment to append to system prompts when language != English. */
export function languageInstruction(name: string | undefined | null): string {
  if (!name || name === "English") return "";
  return `\n\nIMPORTANT: Respond ENTIRELY in ${name}. Translate every natural-language string (titles, blurbs, ingredient names, steps, tips, substitutions, cuisine labels) into ${name}. Keep numeric quantities and units. Do not mix languages. JSON keys/structure stay the same.`;
}