import { AnonymizationResult, DataSourceValue } from "@models/processed";
import { DonationErrors, DonationValidationError } from "@services/errors";
import { handleFacebookZipFiles, handleInstagramZipFiles } from "@services/parsing/meta/metaHandlers";
import { extractTxtFilesFromZip } from "@services/parsing/shared/zipExtraction";
import handleWhatsappTxtFiles from "@services/parsing/whatsapp/whatsappHandler";
import { validateMinChatsForDonation, validateMinImportantChatsForDonation, validateMinTimePeriodForDonation } from "@services/validation";

// Conditional import for server-side only
// iMessage handler is only imported on server-side to avoid sql.js in client bundle
let handleImessageDBFiles: ((files: File[]) => Promise<AnonymizationResult>) | null = null;
if (typeof window === "undefined") {
  // Server-side: import the actual handler
  handleImessageDBFiles = require("@services/parsing/imessage/imessageHandler").default;
}

export async function anonymizeData(dataSourceValue: DataSourceValue, files: File[]): Promise<AnonymizationResult> {
  let resultPromise;
  switch (dataSourceValue) {
    case DataSourceValue.WhatsApp:
      const txtFiles: File[] = [];
      const zipFilesPromises: Promise<File[]>[] = [];

      // Separate text files and handle zip files
      files.forEach(file => {
        if (file.type === "text/plain") {
          txtFiles.push(file);
        } else {
          zipFilesPromises.push(extractTxtFilesFromZip(file));
        }
      });

      resultPromise = Promise.all(zipFilesPromises).then(unzippedFiles => handleWhatsappTxtFiles(txtFiles.concat(unzippedFiles.flat())));
      break;
    case DataSourceValue.Facebook:
      resultPromise = handleFacebookZipFiles(files);
      break;
    case DataSourceValue.Instagram:
      resultPromise = handleInstagramZipFiles(files);
      break;
    case DataSourceValue.IMessage:
      // For iMessage, we need to use server action if on client side
      if (typeof window !== "undefined") {
        // Client-side: use server action
        const { processImessageFiles } = await import("@/app/data-donation/imessageActions");
        if (files.length !== 1) {
          throw DonationValidationError(DonationErrors.NotSingleDBFile);
        }
        const fileBuffer = await files[0].arrayBuffer();
        resultPromise = processImessageFiles(fileBuffer);
      } else {
        // Server-side: use local handler
        if (!handleImessageDBFiles) {
          throw new Error("iMessage handler not available on server");
        }
        resultPromise = handleImessageDBFiles(files);
      }
      break;
  }

  const result = await resultPromise;

  // Validation for the number of conversations
  if (!validateMinChatsForDonation(result.anonymizedConversations)) {
    throw DonationValidationError(DonationErrors.TooFewChats);
  }
  // Validation for the number of "important" conversations (based on number of messages and contacts)
  if (!validateMinImportantChatsForDonation(result.anonymizedConversations)) {
    throw DonationValidationError(DonationErrors.TooFewContactsOrMessages);
  }
  // Validation for the time period of the conversations
  if (!validateMinTimePeriodForDonation(result.anonymizedConversations)) {
    throw DonationValidationError(DonationErrors.TooShortTimePeriod);
  }

  return result;
}
