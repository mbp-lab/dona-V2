import { computeConversationHash, shouldHashConversation } from "../conversationHash";
import { Conversation } from "@models/processed";
import { describe, expect, it } from "@jest/globals";

// Mock aliasConfig so computeConversationHash can resolve donor alias
jest.mock("@services/parsing/shared/aliasConfig", () => ({
  getAliasConfig: () => ({
    systemAlias: "System",
    contactAlias: "Contact",
    donorAlias: "Alice",
    chatAlias: "Chat"
  })
}));

describe("computeConversationHash", () => {
  it("should return null for a conversation with no messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash = computeConversationHash(conversation);
    expect(hash).toBeNull();
  });

  it("should return an array of hashes for a conversation with messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash = computeConversationHash(conversation);
    expect(hash).toBeTruthy();
    expect(Array.isArray(hash)).toBe(true);
    expect(hash!.length).toBeGreaterThan(0);
    expect(hash![0]).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  it("should compute a hash for a conversation with only audio messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [],
      messagesAudio: [
        { timestamp: 1000, lengthSeconds: 30, sender: "Alice" },
        { timestamp: 2000, lengthSeconds: 45, sender: "Bob" }
      ],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash = computeConversationHash(conversation);
    expect(hash).toBeTruthy();
    expect(Array.isArray(hash)).toBe(true);
    expect(hash!.length).toBeGreaterThan(0);
    expect(hash![0]).toHaveLength(64);
  });

  it("should compute a hash for a conversation with both text and audio messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 3000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [{ timestamp: 2000, lengthSeconds: 30, sender: "Alice" }],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash = computeConversationHash(conversation);
    expect(hash).toBeTruthy();
    expect(Array.isArray(hash)).toBe(true);
    expect(hash!.length).toBeGreaterThan(0);
    expect(hash![0]).toHaveLength(64);
  });

  it("should produce separate hashes for different months", () => {
    // January 2024 timestamp (roughly Jan 15, 2024)
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();
    // February 2024 timestamp (roughly Feb 15, 2024)
    const feb2024 = new Date("2024-02-15T12:00:00Z").getTime();

    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: feb2024, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hashes = computeConversationHash(conversation);
    expect(hashes).toBeTruthy();
    expect(Array.isArray(hashes)).toBe(true);
    // Messages in different months should produce 2 hashes
    expect(hashes!.length).toBe(2);
    // Each hash should be different
    expect(hashes![0]).not.toEqual(hashes![1]);
  });

  it("should produce the same hashes for identical conversations", () => {
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();

    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).toEqual(hash2);
  });

  it("should produce different hashes for conversations with different message content", () => {
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();

    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1000, wordCount: 15, sender: "Bob" } // Different word count
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).not.toEqual(hash2);
  });

  it("should produce the same hash when a non-donor sender name changes (role preserved)", () => {
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();
    // donorAlias is mocked as "Alice" above
    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" }, // donor -> ego
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Bob" } // non-donor -> alter
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" }, // donor -> ego
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Charlie" } // different non-donor -> still alter
      ],
      messagesAudio: [],
      participants: ["Alice", "Charlie"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).toEqual(hash2);
  });

  it("should produce different hashes when sender changes", () => {
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();

    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Bob" }, // Sender swapped
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Alice" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).not.toEqual(hash2);
  });

  it("should produce the same hash regardless of message order in input", () => {
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();

    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Bob" },
        { timestamp: jan2024 + 2000, wordCount: 15, sender: "Alice" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    // Messages in different order but same timestamps
    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024 + 2000, wordCount: 15, sender: "Alice" },
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).toEqual(hash2);
  });

  it("should produce different hashes when timestamps differ", () => {
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();

    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: jan2024 + 1001, wordCount: 10, sender: "Bob" } // Different timestamp
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).not.toEqual(hash2);
  });

  it("should not include conversation metadata in hash", () => {
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();

    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [{ timestamp: jan2024, wordCount: 5, sender: "Alice" }],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "Facebook", // Different data source
      messages: [{ timestamp: jan2024, wordCount: 5, sender: "Alice" }],
      messagesAudio: [],
      participants: ["Alice", "Charlie"], // Different participants
      conversationPseudonym: "Conv2" // Different pseudonym
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).toEqual(hash2); // Should be same since messages are identical
  });

  it("should detect partial overlap when new messages are added in a new month", () => {
    // January 2024 timestamp
    const jan2024 = new Date("2024-01-15T12:00:00Z").getTime();
    // February 2024 timestamp
    const feb2024 = new Date("2024-02-15T12:00:00Z").getTime();

    // Original conversation: Jan-Feb
    const originalConversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: feb2024, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    // Extended conversation: Jan-Feb-Mar (with same Jan-Feb messages)
    const mar2024 = new Date("2024-03-15T12:00:00Z").getTime();
    const extendedConversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: jan2024, wordCount: 5, sender: "Alice" },
        { timestamp: feb2024, wordCount: 10, sender: "Bob" },
        { timestamp: mar2024, wordCount: 15, sender: "Alice" } // New message in March
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const originalHashes = computeConversationHash(originalConversation);
    const extendedHashes = computeConversationHash(extendedConversation);

    expect(originalHashes!.length).toBe(2); // Jan, Feb
    expect(extendedHashes!.length).toBe(3); // Jan, Feb, Mar

    // Jan and Feb hashes should be the same (overlap detection)
    expect(originalHashes![0]).toEqual(extendedHashes![0]); // January hash matches
    expect(originalHashes![1]).toEqual(extendedHashes![1]); // February hash matches
  });
});

describe("shouldHashConversation", () => {
  it("should return true for conversation with exactly minimum messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(100)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(true);
  });

  it("should return true for conversation with more than minimum messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(150)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(true);
  });

  it("should return false for conversation with fewer than minimum messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(50)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(false);
  });

  it("should count both text and audio messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(60)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: Array(40)
        .fill(null)
        .map((_, i) => ({
          timestamp: (i + 60) * 1000,
          lengthSeconds: 30,
          sender: "Bob"
        })),
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(true);
  });

  it("should use default threshold of 50 when not specified", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(49)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation)).toBe(false);
  });

  it("should handle conversation with no messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(false);
  });
});
