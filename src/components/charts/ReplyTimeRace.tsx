import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { ReplyTimeRacer } from '@models/graphData';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DownloadButtons from "@components/charts/DownloadButtons";

interface ReplyTimeRaceProps {
    raceData?: ReplyTimeRacer[];
}

export default function ReplyTimeRace({ raceData }: ReplyTimeRaceProps) {
    const safeRaceData = raceData || [];

    const CHART_ID = "reply-time-race-chart";
    const FILE_NAME = "reply-time-race";

    const maxTime = useMemo(() => {
        if (!safeRaceData || safeRaceData.length === 0) return 1;
        // add a small buffer to maxTime so the slowest person doesn't have a 0-length bar
        return Math.max(...safeRaceData.map(r => r.avgReplyTimeMinutes)) * 1.1; 
    }, [safeRaceData]);

    if (safeRaceData.length === 0) {
        return <Typography>Not enough data to show reply time comparison.</Typography>;
    }
    
    return (
        <Box 
            id={CHART_ID} 
            sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                p: 2,
                position: 'relative', // needed for absolute positioning
                bgcolor: '#FFFFFF' 
            }}
        >
            <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 100 }}>
                <DownloadButtons chartId={CHART_ID} fileNamePrefix={FILE_NAME} />
            </Box>

            <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '35px',
                position: 'relative',
                pl: '35px',
                pt: '20px'
            }}>
                {/* start line */}
                <Box sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '30px',
                    bgcolor: 'grey.700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                }}>
                    <Typography sx={{ transform: 'rotate(-90deg)', color: 'white', fontWeight: 'bold' }}>START</Typography>
                </Box>
                
                {safeRaceData.map((racer, index) => {
                    // normalized bar width logic
                    let normalizedTime = maxTime > 0 ? racer.avgReplyTimeMinutes / maxTime : 1;
                    if (normalizedTime > 1) normalizedTime = 1; // cap at 100% in case of buffer
                    const barWidth = (1 - normalizedTime) * 95 + 5; // scales results between 5% and 100% width

                    return (
                        <Box key={index} sx={{ width: '100%' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'left', mb: 0.5 }}>
                                {racer.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                    height: '30px',
                                    width: `${barWidth}%`,
                                    bgcolor: 'primary.main',
                                    borderRadius: '4px',
                                    transition: 'width 0.6s ease-out',
                                }}/>
                                <DirectionsRunIcon sx={{ fontSize: '35px' }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {racer.formattedTime}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}