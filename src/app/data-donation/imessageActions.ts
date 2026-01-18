"use server";

import { AnonymizationResult, DataSourceValue } from "@models/processed";
import { DonationErrors, DonationValidationError } from "@services/errors";
import handleImessageDBFiles from "@services/parsing/imessage/imessageHandler";

/**
 * Server action to process iMessage database files
 * This is a server-only action to handle sql.js dependency which requires Node.js modules
 */
export async function processImessageFiles(fileBuffer: ArrayBuffer): Promise<AnonymizationResult> {
  // Convert ArrayBuffer back to File object
  const file = new File([fileBuffer], "chat.db", { type: "application/x-sqlite3" });

  // Process the iMessage database file
  const result = await handleImessageDBFiles([file]);

  return result;
}
