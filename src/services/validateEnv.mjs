import { z } from "zod";

const supportedLanguages = ["en", "de", "hy"];

const parseLanguageList = value =>
  value
    .split(",")
    .map(lang => lang.trim())
    .filter(Boolean);

const envSchema = z.object({
  DEMO_MODE: z.enum(["true", "false"]).default("false"),
  UPLOAD_TEST_ENABLED: z.enum(["true", "false"]).default("true"),
  CONSENT_ENABLED: z.enum(["true", "false"]).default("true"),
  TOKEN_REQUIRED: z.enum(["true", "false"]).default("true"),
  PUBLIC_DATA_DONATION_ENABLED: z.enum(["true", "false"]).default("false"),
  DUPLICATE_DONATION_CHECK_ENABLED: z.enum(["true", "false"]).default("true"),
  DUPLICATE_CHECK_CSV_DOWNLOAD_ENABLED: z.enum(["true", "false"]).default("false"),
  ENABLED_DATA_SOURCES: z.string().default("WhatsApp,Facebook,Instagram,IMessage"),
  DONOR_ID_INPUT_METHOD: z.enum(["automated", "showid", "manually"]).default("automated"),
  BROWSER_LANGUAGE_ENABLED: z.enum(["true", "false"]).default("false"),
  // A survey is shown when its link is set
  DONOR_SURVEY_LINK: z.string().url().optional(),
  FEEDBACK_SURVEY_LINK: z.string().url().optional(),
  ENABLED_LANGUAGES: z.string().default("en,de,hy"),
  DEFAULT_LANGUAGE: z.string().default("en"),
  // Numbers are parsed in src/config.ts, which falls back to the default for invalid values
  MIN_CHATS_FOR_DONATION: z.string().optional(),
  MIN_MESSAGES_PER_CHAT: z.string().optional(),
  MIN_CONTACTS_PER_CHAT: z.string().optional(),
  MAX_FEEDBACK_CHATS: z.string().optional(),
  MIN_FEEDBACK_CHATS: z.string().optional(),
  DEFAULT_FEEDBACK_CHATS: z.string().optional(),
  MIN_MESSAGES_FOR_DUPLICATE_CHECK: z.string().optional()
}).superRefine((env, ctx) => {
  const enabledLanguages = parseLanguageList(env.ENABLED_LANGUAGES);

  if (enabledLanguages.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ENABLED_LANGUAGES"],
      message: "ENABLED_LANGUAGES must contain at least one language code"
    });
    return;
  }

  const invalidLanguages = enabledLanguages.filter(lang => !supportedLanguages.includes(lang));

  if (invalidLanguages.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ENABLED_LANGUAGES"],
      message: `ENABLED_LANGUAGES contains unsupported languages: ${invalidLanguages.join(", ")}`
    });
  }

  if (!supportedLanguages.includes(env.DEFAULT_LANGUAGE)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DEFAULT_LANGUAGE"],
      message: `DEFAULT_LANGUAGE must be one of: ${supportedLanguages.join(", ")}`
    });
  }

  if (!enabledLanguages.includes(env.DEFAULT_LANGUAGE)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DEFAULT_LANGUAGE"],
      message: "DEFAULT_LANGUAGE must be included in ENABLED_LANGUAGES"
    });
  }
});

// Removed variables that would otherwise be ignored silently, mapped to what replaces them
const removedVariables = {
  DONOR_SURVEY_ENABLED: "the donor survey is shown when DONOR_SURVEY_LINK is set",
  FEEDBACK_SURVEY_ENABLED: "the feedback survey is shown when FEEDBACK_SURVEY_LINK is set",
  NEXT_PUBLIC_MIN_CHATS_FOR_DONATION: "renamed to MIN_CHATS_FOR_DONATION",
  NEXT_PUBLIC_MIN_MESSAGES_PER_CHAT: "renamed to MIN_MESSAGES_PER_CHAT",
  NEXT_PUBLIC_MIN_CONTACTS_PER_CHAT: "renamed to MIN_CONTACTS_PER_CHAT",
  NEXT_PUBLIC_MAX_FEEDBACK_CHATS: "renamed to MAX_FEEDBACK_CHATS",
  NEXT_PUBLIC_MIN_FEEDBACK_CHATS: "renamed to MIN_FEEDBACK_CHATS",
  NEXT_PUBLIC_DEFAULT_FEEDBACK_CHATS: "renamed to DEFAULT_FEEDBACK_CHATS",
  NEXT_PUBLIC_MIN_MESSAGES_FOR_DUPLICATE_CHECK: "renamed to MIN_MESSAGES_FOR_DUPLICATE_CHECK",
  NEXT_ALLOWED_DEV_ORIGINS: "split into DEV_ALLOWED_ORIGINS and SERVER_ACTIONS_ALLOWED_ORIGINS"
};

export const validateEnv = () => {
  const removedInUse = Object.keys(removedVariables).filter(key => process.env[key]);
  if (removedInUse.length > 0) {
    throw new Error(
      `Environment validation failed: ${removedInUse.map(key => `${key} was removed (${removedVariables[key]})`).join(", ")}`
    );
  }

  try {
    // Docker/Compose can inject empty strings for unset variables (e.g., DEMO_MODE="").
    // Treat empty strings as undefined so zod defaults can be applied.
    const normalizedEnv = Object.fromEntries(
      Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value])
    );

    const parsedEnv = envSchema.parse(normalizedEnv);

    // Drop unset optional values and convert the rest to strings for Next.js compatibility
    return Object.fromEntries(
      Object.entries(parsedEnv)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    );
  } catch (err) {
    throw new Error(
      err instanceof z.ZodError
        ? `Environment validation failed: ${err.issues.map(e => e.message).join(", ")}`
        : `Unexpected error during environment validation: ${String(err)}`
    );
  }
};
