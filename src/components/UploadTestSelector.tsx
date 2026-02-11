"use client";

import Alert, { AlertProps } from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import styled from "@mui/material/styles/styled";
import React, { ChangeEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { CONFIG } from "@/config";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { anonymizeData } from "@/services/anonymization";
import { computeConversationHash, shouldHashConversation } from "@/services/conversationHash";
import { validateMinChatsForDonation, validateMinImportantChatsForDonation } from "@/services/validation";
import { DonationValidationError, DonationErrors, getErrorMessage } from "@/services/errors";
import { checkForDuplicateConversations } from "@/app/data-donation/actions";

import { FileList, FileUploadButton, RemoveButton } from "@components/DonationComponents";
import { DataSourceValue } from "@models/processed";

const UploadAlert = styled((props: AlertProps) => <Alert severity="error" {...props} />)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: "100%"
}));

interface UploadTestSelectorProps {
  dataSourceValue: DataSourceValue;
  onValidationChange?: (isValid: boolean) => void;
}

const UploadTestSelector: React.FC<UploadTestSelectorProps> = ({ dataSourceValue, onValidationChange }) => {
  const donation = useRichTranslations("donation");
  const testUpload = useRichTranslations("testUpload");
  const links = useTranslations("links");
  const urls = useTranslations("urls");

  const acceptedFileTypes =
    dataSourceValue == DataSourceValue.WhatsApp ? ".txt, .zip" : dataSourceValue == DataSourceValue.IMessage ? ".db" : ".zip";

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<1 | 2>(1);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const updateValidity = (valid: boolean) => {
    setIsValid(valid);
    onValidationChange?.(valid);
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setCopyStatus(null);
    updateValidity(false);

    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
    if (files.length === 0) return;

    setIsLoading(true);
    setLoadingStep(1);

    try {
      const result = await anonymizeData(dataSourceValue, files);

      setLoadingStep(2);
      const conversationsWithHashes = result.anonymizedConversations.map(convo => {
        const hash = shouldHashConversation(convo) ? computeConversationHash(convo) : null;
        return {
          ...convo,
          conversationHash: hash
        };
      });

      const hashes = conversationsWithHashes.map(convo => convo.conversationHash).filter((hash): hash is string => hash !== null);
      if (hashes.length > 0) {
        const duplicateCheck = await checkForDuplicateConversations(hashes);
        if (!duplicateCheck.success) {
          throw duplicateCheck.error;
        }
      }

      if (!validateMinChatsForDonation(conversationsWithHashes)) {
        throw DonationValidationError(DonationErrors.TooFewChats);
      }
      if (!validateMinImportantChatsForDonation(conversationsWithHashes)) {
        throw DonationValidationError(DonationErrors.TooFewContactsOrMessages);
      }

      updateValidity(true);
    } catch (err) {
      const errorMessage = getErrorMessage(donation.t, err as Error, CONFIG);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingStep(1);
    }
  };

  const handleClearFiles = () => {
    setError(null);
    setCopyStatus(null);
    updateValidity(false);
    setSelectedFiles([]);
    setFileInputKey(prevKey => prevKey + 1);
  };

  const handleCopyError = async () => {
    if (!error) return;
    try {
      await navigator.clipboard.writeText(error);
      setCopyStatus(testUpload.t("copy.success"));
    } catch {
      setCopyStatus(testUpload.t("copy.fail"));
    }
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: "bold" }}>{donation.t("selectData.instruction")}</Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <FileUploadButton key={fileInputKey} onChange={handleFileSelection} loading={isLoading} accept={acceptedFileTypes} />
        <RemoveButton onClick={handleClearFiles} loading={isLoading} />
      </Box>

      {selectedFiles.length > 0 && (
        <Box sx={{ my: 3, width: "100%" }}>
          <FileList files={selectedFiles} />
          {error && <UploadAlert>{error}</UploadAlert>}
        </Box>
      )}

      {isLoading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {loadingStep === 1
            ? donation.t("anonymisation.processingStep", { step: "1/2" })
            : donation.t("anonymisation.checkingDuplicatesStep", { step: "2/2" })}
        </Alert>
      )}

      {!error && !isLoading && isValid && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {testUpload.t("success")}
        </Alert>
      )}

      {error && !isLoading && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography variant="body2">{testUpload.t("errorHelp")}</Typography>
          <Stack spacing={1} direction={{ xs: "column", sm: "row" }} sx={{ alignItems: "flex-start" }}>
            <Button variant="outlined" onClick={handleCopyError} disabled={!error}>
              {testUpload.t("copy.button")}
            </Button>
            <Button variant="text" disabled={!copyStatus} sx={{ pointerEvents: "none" }}>
              {copyStatus || "\u00A0"}
            </Button>
            <Button variant="contained" component="a" href={urls("reportProblem")} target="_blank" rel="noopener noreferrer">
              {links("reportProblem")}
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

export default UploadTestSelector;
