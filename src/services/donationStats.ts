import { Conversation } from "@models/processed";

export interface DonationStats {
  totalConversations: number;
  totalMessages: number;
  minMessagesPerConversation: number;
  maxMessagesPerConversation: number;
  meanMessagesPerConversation: number;
}

/**
 * Calculates statistics about the donation data.
 * @param conversations - Array of conversations to analyze
 * @returns DonationStats object with statistics about the conversations
 */
export function calculateDonationStats(conversations: Conversation[]): DonationStats {
  const totalConversations = conversations.length;

  if (totalConversations === 0) {
    return {
      totalConversations: 0,
      totalMessages: 0,
      minMessagesPerConversation: 0,
      maxMessagesPerConversation: 0,
      meanMessagesPerConversation: 0
    };
  }

  // Calculate message counts per conversation (text + audio)
  const messageCounts = conversations.map(convo => (convo.messages?.length ?? 0) + (convo.messagesAudio?.length ?? 0));

  const totalMessages = messageCounts.reduce((sum, count) => sum + count, 0);
  const minMessagesPerConversation = Math.min(...messageCounts);
  const maxMessagesPerConversation = Math.max(...messageCounts);
  const meanMessagesPerConversation = totalMessages / totalConversations;

  return {
    totalConversations,
    totalMessages,
    minMessagesPerConversation,
    maxMessagesPerConversation,
    meanMessagesPerConversation
  };
}
