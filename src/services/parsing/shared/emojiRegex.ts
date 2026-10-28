/**
 * Emoji regex pattern
 * This pattern matches emoji characters including those with skin tone modifiers
 * 
 * Separated from emojiDictionary.ts to avoid importing Node.js 'fs' module in client components
 */
export const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;
