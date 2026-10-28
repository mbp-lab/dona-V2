import { afterAll, beforeAll, beforeEach, describe, expect, test, jest } from "@jest/globals";

import { createMockDbClient } from "@/app/__tests__/mockDbClient";
import { DonationErrors } from "@/services/errors";

describe("donation actions - unit", () => {
  // The actions read their configuration on import, so pin it independently of the local .env
  const originalDemoMode = process.env.DEMO_MODE;
  const originalDuplicateCheck = process.env.DUPLICATE_DONATION_CHECK_ENABLED;
  let actions: typeof import("@/app/data-donation/actions");
  let mock: ReturnType<typeof createMockDbClient>;

  beforeAll(async () => {
    process.env.DEMO_MODE = "false";
    process.env.DUPLICATE_DONATION_CHECK_ENABLED = "true";
    jest.resetModules();
    actions = await import("@/app/data-donation/actions");
  });

  afterAll(() => {
    process.env.DEMO_MODE = originalDemoMode;
    process.env.DUPLICATE_DONATION_CHECK_ENABLED = originalDuplicateCheck;
    jest.resetModules();
  });

  beforeEach(() => {
    mock = createMockDbClient();
  });

  test("startDonation returns donationId and donorId on success", async () => {
    const { client } = mock;
    const res = await actions.startDonation(undefined, undefined, client);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(typeof res.data!.donationId).toBe("string");
    expect(typeof res.data!.donorId).toBe("string");
  });

  test("startDonation returns DonationProcessingError with reason TransactionFailed when insert throws", async () => {
    const throwing = createMockDbClient({
      insert: () =>
        ({
          values: () => {
            throw new Error("insert-failed");
          }
        }) as any
    }).client;

    const res = await actions.startDonation("ext-1", undefined, throwing);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect((res.error as any).reason).toBe(DonationErrors.TransactionFailed);
  });

  test("appendConversationBatch inserts conversations, messages and participants", async () => {
    const { client } = mock;

    const batch = [
      {
        dataSource: "Default",
        participants: ["Donor", "Alice"],
        messages: [
          { sender: "Donor", text: "Hi", createdAt: new Date().toISOString() },
          { sender: "Alice", text: "Hello", createdAt: new Date().toISOString() }
        ],
        messagesAudio: [
          {
            sender: "Alice",
            url: "https://example.com/a1.mp3",
            createdAt: new Date().toISOString()
          }
        ]
      }
    ];

    const result = await actions.appendConversationBatch("don-1", "donor-uuid-1", batch as any, "Donor", client);
    expect(result.success).toBe(true);
  });

  test("appendConversationBatch handles large message volumes by splitting windows", async () => {
    const { client } = mock;

    const manyMessages = Array.from({ length: 15000 }).map((_, i) => ({
      sender: i % 2 === 0 ? "Donor" : "Alice",
      text: `msg-${i}`,
      createdAt: new Date().toISOString()
    }));
    const batch = [
      {
        dataSource: "Default",
        participants: ["Donor", "Alice"],
        messages: manyMessages,
        messagesAudio: []
      }
    ];

    const result = await actions.appendConversationBatch("don-2", "donor-uuid-2", batch as any, "Donor", client);
    expect(result.success).toBe(true);
  });

  test("finalizeDonation writes graphData and updates donation status", async () => {
    const { client } = mock;

    const graph = { nodes: [], edges: [] };
    const res = await actions.finalizeDonation("don-3", graph, client);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.donationId).toBe("don-3");
  });

  test("finalizeDonation returns error when transaction fails", async () => {
    const throwingTx = createMockDbClient({
      transaction: async (_fn: any) => {
        throw new Error("tx-failed");
      }
    }).client;

    const res = await actions.finalizeDonation("don-4", { foo: "bar" }, throwingTx);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  test("checkForDuplicateConversations returns hasDuplicates=false when no duplicate hashes exist", async () => {
    const overriding = createMockDbClient({
      query: {
        conversations: {
          findMany: jest.fn(async (_opts?: any): Promise<any[]> => [])
        }
      }
    } as any).client;

    const hashes = ["hash-a", "hash-b"];
    const res = await actions.checkForDuplicateConversations(hashes, overriding);

    expect(overriding.query!.conversations!.findMany).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.hasDuplicates).toBe(false);
  });

  test("checkForDuplicateConversations returns DuplicateConversation error when duplicates exist", async () => {
    const existing = [{ id: "existing-1", conversationHash: "hash-a" }];
    const overriding = createMockDbClient({
      query: {
        conversations: {
          findMany: jest.fn(async (_opts?: any): Promise<any[]> => existing)
        }
      }
    } as any).client;

    const hashes = ["hash-a", "hash-b"];
    const res = await actions.checkForDuplicateConversations(hashes, overriding);

    expect(overriding.query!.conversations!.findMany).toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect((res.error as any).reason).toBe(DonationErrors.DuplicateConversation);
  });
});
