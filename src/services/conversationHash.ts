import { createHash } from "crypto";
import { Conversation, Message, MessageAudio } from "@models/processed";
import { getAliasConfig } from "@services/parsing/shared/aliasConfig";

/**
 * Groups a timestamp (in milliseconds) to a YYYY-MM string.
 */
function getMonthKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Computes an array of SHA-256 hashes for a conversation, one per calendar month.
 *
 * Each hash is computed from all messages (both text and audio) in that month
 * to enable partial duplicate detection. If new messages are added to a conversation
 * in a later month, only that month's hash changes—existing months still match.
 *
 * The hash for each month includes:
 * - For regular messages: timestamp, wordCount, senderRole ("ego" | "alter")
 * - For audio messages: timestamp, lengthSeconds, senderRole ("ego" | "alter")
 *
 * Messages are sorted by timestamp before hashing to ensure consistent results
 * regardless of the order in which messages appear in the input.
 *
 * @param conversation - The conversation to hash
 * @returns An array of SHA-256 hashes as hexadecimal strings (one per month), or null if conversation has no messages
 */
export function computeConversationHash(conversation: Conversation): string[] | null {
  const textMessages = conversation.messages || [];
  const audioMessages = conversation.messagesAudio || [];

  if (textMessages.length === 0 && audioMessages.length === 0) {
    return null;
  }

  // Create a combined array of message data for hashing
  interface MessageData {
    timestamp: number;
    type: "text" | "audio";
    wordCount?: number;
    lengthSeconds?: number;
    senderRole: "ego" | "alter";
  }

  const { donorAlias } = getAliasConfig();

  const toRole = (sender: string): "ego" | "alter" => (sender === donorAlias ? "ego" : "alter");

  const messageData: MessageData[] = [
    ...textMessages.map((msg: Message) => ({
      timestamp: msg.timestamp,
      type: "text" as const,
      wordCount: msg.wordCount,
      senderRole: toRole(msg.sender)
    })),
    ...audioMessages.map((msg: MessageAudio) => ({
      timestamp: msg.timestamp,
      type: "audio" as const,
      lengthSeconds: msg.lengthSeconds,
      senderRole: toRole(msg.sender)
    }))
  ];

  // Group messages by month
  const messagesByMonth: Map<string, MessageData[]> = new Map();
  for (const msg of messageData) {
    const monthKey = getMonthKey(msg.timestamp);
    if (!messagesByMonth.has(monthKey)) {
      messagesByMonth.set(monthKey, []);
    }
    messagesByMonth.get(monthKey)!.push(msg);
  }

  // Sort month keys to ensure consistent ordering of output array
  const sortedMonths = Array.from(messagesByMonth.keys()).sort();

  // Compute hash for each month
  const monthlyHashes: string[] = [];
  for (const monthKey of sortedMonths) {
    const monthMessages = messagesByMonth.get(monthKey)!;
    monthMessages.sort((a, b) => a.timestamp - b.timestamp);
    const dataString = JSON.stringify(monthMessages);
    const hash = createHash("sha256");
    hash.update(dataString);
    monthlyHashes.push(hash.digest("hex"));
  }

  return monthlyHashes;
}

/**
 * Checks if a conversation meets the minimum message threshold for hash computation.
 *
 * @param conversation - The conversation to check
 * @param minMessages - Minimum number of messages required (default: 50)
 * @returns True if the conversation has enough messages
 */
export function shouldHashConversation(conversation: Conversation, minMessages: number = 50): boolean {
  const textCount = conversation.messages?.length || 0;
  const audioCount = conversation.messagesAudio?.length || 0;
  const totalMessages = textCount + audioCount;

  return totalMessages >= minMessages;
}
