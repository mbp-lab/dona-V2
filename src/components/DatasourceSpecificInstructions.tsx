"use client";

import { useRichTranslations } from "@/hooks/useRichTranslations";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";
import { BlockTitle } from "@/styles/StyledTypography";
import { InstructionVideo, StepsList, TabbedInstructionVideo } from "@/components/InstructionComponents";
import { DataSourceValue } from "@models/processed";

export default function DatasourceSpecificInstructions({ dataSource }: { dataSource: DataSourceValue }) {
    const source = useRichTranslations(dataSource.toLowerCase());
    const generic = useRichTranslations("instructions");

    const isWhatsApp = dataSource === DataSourceValue.WhatsApp;
    const isIMessage = dataSource === DataSourceValue.IMessage;
    const isInstagram = dataSource === DataSourceValue.Instagram;
    const secondParagraph = isWhatsApp ? "selection" : "duration";
    const stepsCount = dataSource === DataSourceValue.IMessage ? 6 : isWhatsApp ? 8 : isInstagram ? 18 : 19;
    const verticalVideo = isWhatsApp || dataSource === DataSourceValue.Instagram;

    const externalLinks = {
        link_android: `${dataSource.toLowerCase()}.android-documentation`,
        link_ios: `${dataSource.toLowerCase()}.ios-documentation`,
        link: `${dataSource.toLowerCase()}.external-documentation`,
    };

    const FirstBlock = ({ halfWidth = false }: { halfWidth?: boolean }) => {
        if (isIMessage) {
            return (
                <Grid size={{ xs: 12, md: halfWidth ? 6 : 10 }}>
                    <Typography>{source.rich("devices.body")}</Typography>
                </Grid>
            );
        }
        return (
            <Grid size={{ xs: 12, md: halfWidth ? 6 : 10 }}>
                <BlockTitle>{generic.t("headers.devices")}</BlockTitle>
                <Typography>{source.rich("devices.body")}</Typography>

                <BlockTitle>{source.t(`${secondParagraph}.title`)}</BlockTitle>
                <Typography>{source.rich(`${secondParagraph}.body`)}</Typography>

                <BlockTitle>{generic.t("headers.data-deletion")}</BlockTitle>
                <Typography>
                    {source.rich("data-deletion.body", {
                        link: "secure-delete",
                        link_datenschutz: "datenschutz",
                        link_android: "delete-from-android",
                        link_ios: "delete-from-ios",
                    })}
                </Typography>
            </Grid>
        );
    };

    if (isIMessage) {
        return (
            <Grid container spacing={2} mt={-2} justifyContent="center" alignItems="flex-start">
                <FirstBlock />
            </Grid>
        );
    }
    return (
        <Grid container spacing={2} mt={-2} justifyContent="center" alignItems="flex-start">
            {verticalVideo ? (
                <Grid container spacing={2} alignItems="flex-start">
                    <FirstBlock halfWidth />
                    <Grid size={{ xs: 12, md: 6 }}>
                        {
                            isWhatsApp ? (
                                <TabbedInstructionVideo
                                    iosVideoUrl={source.t("video.ios")}
                                    androidVideoUrl={source.t("video.android")}
                                    iosCaption={source.t("video.ios-caption")}
                                    androidCaption={source.t("video.android-caption")}
                                />
                            ) : (
                                <InstructionVideo videoUrl={source.t("video")} />
                            )
                        }
                    </Grid>
                </Grid>
            ) : (
                <>
                    <FirstBlock />
                    <InstructionVideo videoUrl={source.t("video")} />
                </>
            )}

            <StepsList title={generic.t("headers.overview")} translation={source} count={stepsCount} />

            <Grid size={{ xs: 12, md: 10 }}>
                <Typography>{source.rich("external-documentation", externalLinks)}</Typography>
            </Grid>
        </Grid>
    );
}
