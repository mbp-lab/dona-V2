import { describe, expect, it } from "@jest/globals";

import { Conversation } from "@models/processed";
import { calculateDonationStats, DonationStats } from "@services/donationStats";

describe("calculateDonationStats", () => {
  it("handles empty conversations array", () => {
    const result = calculateDonationStats([]);
    expect(result).toEqual({
      totalConversations: 0,
      totalMessages: 0,
      minMessagesPerConversation: 0,
      maxMessagesPerConversation: 0,
      meanMessagesPerConversation: 0
    });
  });

  it("calculates stats for a single conversation with messages", () => {
    const conversations: Conversation[] = [
      {
        dataSource: "WhatsApp",
        messages: [
          { timestamp: 1000, wordCount: 5, sender: "Alice" },
          { timestamp: 2000, wordCount: 10, sender: "Bob" },
          { timestamp: 3000, wordCount: 15, sender: "Alice" }
        ],
        messagesAudio: [{ timestamp: 4000, lengthSeconds: 30, sender: "Bob" }],
        participants: ["Alice", "Bob"],
        conversationPseudonym: "Chat1"
      }
    ];

    const result = calculateDonationStats(conversations);
    expect(result).toEqual({
      totalConversations: 1,
      totalMessages: 4, // 3 text + 1 audio
      minMessagesPerConversation: 4,
      maxMessagesPerConversation: 4,
      meanMessagesPerConversation: 4
    });
  });

  it("calculates stats for multiple conversations", () => {
    const conversations: Conversation[] = [
      {
        dataSource: "WhatsApp",
        messages: [
          { timestamp: 1000, wordCount: 5, sender: "Alice" },
          { timestamp: 2000, wordCount: 10, sender: "Bob" }
        ],
        messagesAudio: [],
        participants: ["Alice", "Bob"],
        conversationPseudonym: "Chat1"
      },
      {
        dataSource: "WhatsApp",
        messages: [
          { timestamp: 1000, wordCount: 5, sender: "Charlie" },
          { timestamp: 2000, wordCount: 10, sender: "Dave" },
          { timestamp: 3000, wordCount: 15, sender: "Charlie" },
          { timestamp: 4000, wordCount: 20, sender: "Dave" },
          { timestamp: 5000, wordCount: 25, sender: "Charlie" },
          { timestamp: 6000, wordCount: 30, sender: "Dave" }
        ],
        messagesAudio: [],
        participants: ["Charlie", "Dave"],
        conversationPseudonym: "Chat2"
      },
      {
        dataSource: "WhatsApp",
        messages: [{ timestamp: 1000, wordCount: 5, sender: "Eve" }],
        messagesAudio: [
          { timestamp: 2000, lengthSeconds: 15, sender: "Eve" },
          { timestamp: 3000, lengthSeconds: 30, sender: "Eve" }
        ],
        participants: ["Eve"],
        conversationPseudonym: "Chat3"
      }
    ];

    const result = calculateDonationStats(conversations);
    expect(result).toEqual({
      totalConversations: 3,
      totalMessages: 11, // 2 + 6 + 3
      minMessagesPerConversation: 2,
      maxMessagesPerConversation: 6,
      meanMessagesPerConversation: 11 / 3
    });
  });

  it("handles conversations with no messages", () => {
    const conversations: Conversation[] = [
      {
        dataSource: "WhatsApp",
        messages: [],
        messagesAudio: [],
        participants: ["Alice"],
        conversationPseudonym: "EmptyChat"
      }
    ];

    const result = calculateDonationStats(conversations);
    expect(result).toEqual({
      totalConversations: 1,
      totalMessages: 0,
      minMessagesPerConversation: 0,
      maxMessagesPerConversation: 0,
      meanMessagesPerConversation: 0
    });
  });

  it("handles conversations with only audio messages", () => {
    const conversations: Conversation[] = [
      {
        dataSource: "WhatsApp",
        messages: [],
        messagesAudio: [
          { timestamp: 1000, lengthSeconds: 30, sender: "Alice" },
          { timestamp: 2000, lengthSeconds: 45, sender: "Bob" }
        ],
        participants: ["Alice", "Bob"],
        conversationPseudonym: "AudioChat"
      }
    ];

    const result = calculateDonationStats(conversations);
    expect(result).toEqual({
      totalConversations: 1,
      totalMessages: 2,
      minMessagesPerConversation: 2,
      maxMessagesPerConversation: 2,
      meanMessagesPerConversation: 2
    });
  });

  it("handles undefined messages or messagesAudio", () => {
    const conversations: Conversation[] = [
      {
        dataSource: "WhatsApp",
        messages: undefined as any,
        messagesAudio: undefined as any,
        participants: ["Alice"],
        conversationPseudonym: "UndefinedChat"
      }
    ];

    const result = calculateDonationStats(conversations);
    expect(result).toEqual({
      totalConversations: 1,
      totalMessages: 0,
      minMessagesPerConversation: 0,
      maxMessagesPerConversation: 0,
      meanMessagesPerConversation: 0
    });
  });

  it("handles mix of conversations with varying message counts", () => {
    const conversations: Conversation[] = [
      {
        dataSource: "WhatsApp",
        messages: [],
        messagesAudio: [],
        participants: ["A"],
        conversationPseudonym: "Empty"
      },
      {
        dataSource: "WhatsApp",
        messages: [{ timestamp: 1000, wordCount: 5, sender: "B" }],
        messagesAudio: [],
        participants: ["B"],
        conversationPseudonym: "One"
      },
      {
        dataSource: "WhatsApp",
        messages: [
          { timestamp: 1000, wordCount: 5, sender: "C" },
          { timestamp: 2000, wordCount: 10, sender: "C" },
          { timestamp: 3000, wordCount: 15, sender: "C" },
          { timestamp: 4000, wordCount: 20, sender: "C" },
          { timestamp: 5000, wordCount: 25, sender: "C" }
        ],
        messagesAudio: [
          { timestamp: 6000, lengthSeconds: 30, sender: "C" },
          { timestamp: 7000, lengthSeconds: 45, sender: "C" },
          { timestamp: 8000, lengthSeconds: 60, sender: "C" },
          { timestamp: 9000, lengthSeconds: 75, sender: "C" },
          { timestamp: 10000, lengthSeconds: 90, sender: "C" }
        ],
        participants: ["C"],
        conversationPseudonym: "Ten"
      }
    ];

    const result = calculateDonationStats(conversations);
    expect(result).toEqual({
      totalConversations: 3,
      totalMessages: 11, // 0 + 1 + 10
      minMessagesPerConversation: 0,
      maxMessagesPerConversation: 10,
      meanMessagesPerConversation: 11 / 3
    });
  });
});
