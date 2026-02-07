import { Conversation } from "@models/processed";
import { ChatSummary } from "@models/graphData";
import { produceAnswerTimesPerConversation, produceDailyCountsPerConversation } from "@services/charts/timeAggregates";
import { differenceInCalendarDays } from 'date-fns';

/**
 * calculates summary statistics for each individual chat,
 * sorted by the most active (most total messages) chat first.
 * @param donorId - the ID of the donor.
 * @param conversations - an array of all conversations.
 * @returns an array of ChatSummary objects.
 */
export function produceChatSummaries(donorId: string, conversations: Conversation[]): ChatSummary[] {
    
    // sort the conversations array first based on total messages (sent + received)
    const sortedConversations = [...conversations].sort((a, b) => {
        const totalMessagesA = a.messages.length + a.messagesAudio.length;
        const totalMessagesB = b.messages.length + b.messagesAudio.length;
        return totalMessagesB - totalMessagesA; // Sort in descending order
    });

    // map over the sorted array
    return sortedConversations.map(convo => {
        // calculate total sent messages and words
        const donorMessages = convo.messages.filter(m => m.sender === donorId);
        const donorSentMessages = donorMessages.length;
        const donorSentWords = donorMessages.reduce((sum, m) => sum + m.wordCount, 0);

        // calculate quick reply percentage
        const answerTimes = produceAnswerTimesPerConversation(donorId, convo);
        const donorReplies = answerTimes.filter(at => at.isFromDonor);
        const quickReplies = donorReplies.filter(r => r.responseTimeMs < 60000).length; // under 1 minute
        const quickReplyPercentage = donorReplies.length > 0 ? Math.round((quickReplies / donorReplies.length) * 100) : 0;


        // calculate longest streak
        const dailyWords = produceDailyCountsPerConversation(donorId, convo, "words");
        const dailySeconds = produceDailyCountsPerConversation(donorId, convo, "seconds");
        
        // create a set of days where the donor was active
        const activeDaysSet = new Set<string>();
        
        dailyWords.forEach(d => {
            if (d.sentCount > 0) {
                activeDaysSet.add(`${d.year}-${d.month}-${d.date}`);
            }
        });
        dailySeconds.forEach(d => {
            if (d.sentCount > 0) {
                activeDaysSet.add(`${d.year}-${d.month}-${d.date}`);
            }
        });

        const sortedActiveDates = Array.from(activeDaysSet)
            .map(key => {
                const [year, month, day] = key.split('-').map(Number);
                return new Date(year, month - 1, day);
            })
            .sort((a, b) => a.getTime() - b.getTime());

        let longestStreak = 0;
        let currentStreak = 0;
        if (sortedActiveDates.length > 0) {
            longestStreak = 1;
            currentStreak = 1;
            for (let i = 1; i < sortedActiveDates.length; i++) {
                const diff = differenceInCalendarDays(sortedActiveDates[i], sortedActiveDates[i - 1]);
                if (diff === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            }
        }


        return {
            chatName: convo.conversationPseudonym,
            donorSentMessages,
            donorSentWords,
            quickReplyPercentage,
            longestStreak,
        };
    });
}