import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, translate, type DictKey, type Locale } from "./dictionaries";

const COOKIE_NAME = "locale";

/** Lit la langue de l'interface admin depuis le cookie (côté serveur). */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return (LOCALES as string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

/** Raccourci : langue + fonction de traduction pour les Server Components. */
export async function getServerT() {
  const locale = await getServerLocale();
  return { locale, t: (key: DictKey) => translate(locale, key) };
}
