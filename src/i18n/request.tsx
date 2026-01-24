import { getRequestConfig } from "next-intl/server";

import { getUserLocale } from "@/services/locale";
import de from "../../locales/de.json";
import en from "../../locales/en.json";
import hy from "../../locales/hy.json";

const messages = {
  de,
  en,
  hy
};

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  return {
    locale,
    messages: messages[locale as keyof typeof messages]
  };
});
