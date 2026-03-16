export type Locale = (typeof locales)[number];

export const locales = ["en", "de", "hy"] as const;
export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  hy: "Armenian"
};
export const defaultLocale: Locale = "en";

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
};

const parseNumberEnv = (value: string | undefined, defaultValue: number): number => {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

export const CONFIG = {
  MIN_DONATION_TIME_PERIOD_MONTHS: 6,

  MIN_CHATS_FOR_DONATION: 5,
  MIN_MESSAGES_PER_CHAT: 100,
  MIN_CONTACTS_PER_CHAT: 2,

  DUPLICATE_DONATION_CHECK_ENABLED: parseBooleanEnv(process.env.NEXT_PUBLIC_DUPLICATE_DONATION_CHECK_ENABLED, true),
  MIN_MESSAGES_FOR_DUPLICATE_CHECK: parseNumberEnv(process.env.NEXT_PUBLIC_MIN_MESSAGES_FOR_DUPLICATE_CHECK, 100),

  MAX_FEEDBACK_CHATS: 10,
  MIN_FEEDBACK_CHATS: 3,
  DEFAULT_FEEDBACK_CHATS: 5
};
