import React from 'react';
import { Box, Typography } from '@mui/material';
import { PodiumContact } from '@models/graphData';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DownloadButtons from "@components/charts/DownloadButtons";


interface TopContactsPodiumProps {
    podiumData?: PodiumContact[];
}

export default function TopContactsPodium({ podiumData }: TopContactsPodiumProps) {
    const safePodiumData = podiumData || [];

    const orderedPodium = [
        safePodiumData.find(p => p.rank === 2) || null,
        safePodiumData.find(p => p.rank === 1) || null,
        safePodiumData.find(p => p.rank === 3) || null,
    ];

    const CHART_ID = "top-contacts-podium-chart";
    const FILE_NAME = "top-contacts-podium";

    // base styles
    const standFrontBase = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '12px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        color: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(0,0,0,0.2)', borderTop: 'none',
        width: '100%',
    };

    const standTopBase = {
        height: '25px', width: '100%', border: '1px solid rgba(0,0,0,0.2)', borderBottom: 'none',
    };

    return (
        <Box 
            id={CHART_ID} 
            sx={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#FFFFFF' 
            }}
        >
            <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 100 }}>
                <DownloadButtons chartId={CHART_ID} fileNamePrefix={FILE_NAME} />
            </Box>

            {/* podium container */}
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                flexGrow: 1, // to fill the container height
                width: '100%',
                pb: 2,
                gap: 1.25,
            }}>
                {orderedPodium.map((contact, index) => {
                    if (!contact) {
                        const standWidth = index === 1 ? 130 : 110;
                        const standHeight = index === 1 ? 150 : (index === 0 ? 120 : 90);
                        let clipPath;
                        let zIndex;
                        let marginLeft;

                        switch (index) {
                            case 0: // rank2
                                clipPath = 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)';
                                break;
                            case 1: // rank 1
                                clipPath = 'polygon(15% 0, 85% 0, 100% 100%, 0% 100%)';
                                zIndex = 10;
                                marginLeft = '-15px';
                                break;
                            case 2: // rank 3
                                clipPath = 'polygon(0% 0, 85% 0, 100% 100%, 0% 100%)';
                                marginLeft = '-15px';
                                break;
                            default: clipPath = 'none';
                        }

                        return (
                            <Box key={`empty-${index}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: standWidth, zIndex, marginLeft }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 0.5, visibility: 'hidden' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1 }}>0</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 'medium' }}>messages</Typography>
                                </Box>
                                <Box sx={{ ...standTopBase, background: 'grey.300', clipPath }} />
                                <Box sx={{ ...standFrontBase, height: standHeight, background: 'grey.200' }}>
                                    <Typography variant="h6" sx={{ color: 'grey.500' }}>?</Typography>
                                </Box>
                            </Box>
                        );
                    }

                    let rankStyles;
                    let clipPath;
                    let zIndex;
                    let marginLeft;

                    switch (contact.rank) {
                        case 1:
                            rankStyles = { width: 170, height: 250, topBg: 'linear-gradient(0deg, #f8e7a1, #d1b864ff)', frontBg: 'linear-gradient(180deg, #f3da83, #d1b24eff)' };
                            clipPath = 'polygon(15% 0, 85% 0, 100% 100%, 0% 100%)';
                            zIndex = 10; // to put rank 1 in front
                            marginLeft = '-15px';
                            break;
                        case 2:
                            rankStyles = { width: 150, height: 180, topBg: 'linear-gradient(0deg, #e5e5ef, #bbbbc9ff)', frontBg: 'linear-gradient(180deg, #dadbe6, #a3a3afff)'};
                            clipPath = 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)'; // asymmetrical path, vanishes to the right
                            break;
                        case 3:
                            rankStyles = { width: 150, height: 140, topBg: 'linear-gradient(0deg, #e0bfacff, #af8166ff)', frontBg: 'linear-gradient(180deg, #ecbca1ff, #af8166ff)' };
                            clipPath = 'polygon(0% 0, 85% 0, 100% 100%, 0% 100%)'; // asymmetrical path, vanishes to the left
                            marginLeft = '-15px';
                            break;
                        default: 
                            rankStyles = { width: 0, height: 0, topBg: '', frontBg: '' };
                            clipPath = 'none';
                    }

                    return (
                        <Box key={contact.rank} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: rankStyles.width, zIndex, marginLeft }}>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary', lineHeight: 1 }}>
                                    {contact.messageCount.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
                                    messages
                                </Typography>
                            </Box>
                            
                            <Box sx={{ ...standTopBase, background: rankStyles.topBg, clipPath: clipPath }} />

                            <Box sx={{ ...standFrontBase, background: rankStyles.frontBg, height: rankStyles.height }}>
                                <EmojiEventsIcon sx={{ fontSize: 30, color: 'rgba(0, 0, 0, 0.7)', mb: 0.5 }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                    {contact.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                    Rank {contact.rank}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}