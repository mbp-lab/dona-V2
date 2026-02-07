import { Conversation, Message, MessageAudio } from "@models/processed";
import { DailySentReceivedPoint, PeakDayStats, ActivityStats } from "@models/graphData";
import { calculateMinMaxDates } from "@services/rangeFiltering";

/**
 * calculates the number of active days (where user sent a message)
 * vs total days in the chat history.
 */
export function produceActivityStats(
    dailyWords: DailySentReceivedPoint[],
    dailySeconds: DailySentReceivedPoint[],
    conversations: Conversation[]
): ActivityStats {
    const { minDate, maxDate } = calculateMinMaxDates(conversations, false);

    if (!minDate || !maxDate) {
        return { activeDays: 0, totalDays: 0, activityPercentage: 0 };
    }

    const activeDaysSet = new Set<string>();
    
    dailyWords.forEach(day => {
        if (day.sentCount > 0) {
            activeDaysSet.add(`${day.year}-${day.month}-${day.date}`);
        }
    });

    dailySeconds.forEach(day => {
        if (day.sentCount > 0) {
            activeDaysSet.add(`${day.year}-${day.month}-${day.date}`);
        }
    });

    const activeDays = activeDaysSet.size;

    const totalTimeMs = maxDate.getTime() - minDate.getTime();
    const totalDays = Math.ceil(totalTimeMs / (1000 * 60 * 60 * 24));

    const activityPercentage = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

    return {
        activeDays,
        totalDays,
        activityPercentage,
    };
}


/**
 * finds the peak texting day and calculates stats for it.
 * @param donorId - the ID of the donor.
 * @param conversations - all conversations for a data source.
 * @returns a PeakDayStats object.
 */
export function producePeakDayStats(donorId: string, conversations: Conversation[]): PeakDayStats {
    type MessageWithContext = (Message | MessageAudio) & { conversationPseudonym: string };

    const allMessagesWithContext: MessageWithContext[] = conversations.flatMap(convo => {
        const allConvoMessages = [...convo.messages, ...convo.messagesAudio];
        return allConvoMessages.map(msg => ({
            ...msg,
            conversationPseudonym: convo.conversationPseudonym,
        }));
    });

    if (allMessagesWithContext.length === 0) {
        return { date: "N/A", activeHours: 0, totalMessagesExchanged: 0, topChat: "N/A" };
    }

    const messagesByDay = new Map<string, MessageWithContext[]>();
    allMessagesWithContext.forEach(msg => {
        const d = new Date(msg.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        if (!messagesByDay.has(key)) {
            messagesByDay.set(key, []);
        }
        messagesByDay.get(key)!.push(msg);
    });

    let peakDayKey = "";
    let maxSentCount = -1;
    for (const [key, messages] of messagesByDay.entries()) {
        const sentCount = messages.filter(msg => msg.sender === donorId).length;
        if (sentCount > maxSentCount) {
            maxSentCount = sentCount;
            peakDayKey = key;
        }
    }

    const peakDayMessages = messagesByDay.get(peakDayKey) || [];
    const peakDaySentMessages = peakDayMessages.filter(msg => msg.sender === donorId);

    const activeHourSet = new Set<number>();
    peakDaySentMessages.forEach(msg => { 
        const hour = new Date(msg.timestamp).getHours(); // Gets the hour (0-23)
        activeHourSet.add(hour);
    });
    
    const activeHours = activeHourSet.size;

    const topChatMap = new Map<string, number>();
    peakDaySentMessages.forEach(msg => {
        const pseudonym = msg.conversationPseudonym;
        topChatMap.set(pseudonym, (topChatMap.get(pseudonym) || 0) + 1);
    });

    let topChat = "N/A";
    let maxChatMessages = -1;
    for (const [chat, count] of topChatMap.entries()) {
        if (count > maxChatMessages) {
            maxChatMessages = count;
            topChat = chat;
        }
    }

    // handle case where peakDayKey might be an empty string
    if (!peakDayKey) {
        return { date: "N/A", activeHours: 0, totalMessagesExchanged: 0, topChat: "N/A" };
    }

    const [year, month, day] = peakDayKey.split('-').map(Number);
    const peakDate = new Date(year, month - 1, day);
    const formattedDate = peakDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        date: formattedDate,
        activeHours,
        totalMessagesExchanged: peakDayMessages.length,
        topChat,
    };
}