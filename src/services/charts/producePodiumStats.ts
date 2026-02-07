import { Conversation } from "@models/processed";
import { PodiumContact } from "@models/graphData";

/**
 * calculates the top 3 contacts based on total messages sent by the donor to them.
 * @param donorId - the ID of the donor.
 * @param conversations - an array of all conversations.
 * @returns an array of PodiumContact objects for the top 3
 */
export function producePodiumStats(donorId: string, conversations: Conversation[]): PodiumContact[] {
    const contactMessageCounts: { [pseudonym: string]: number } = {};

    conversations.forEach(convo => {
        const donorMessagesInConvo = convo.messages.filter(m => m.sender === donorId).length;
        if (donorMessagesInConvo > 0) {
            contactMessageCounts[convo.conversationPseudonym] = (contactMessageCounts[convo.conversationPseudonym] || 0) + donorMessagesInConvo;
        }
    });

    // convert to an array, sort by message count descending, and take the top 3
    const sortedContacts = Object.entries(contactMessageCounts)
        .map(([pseudonym, count]) => ({ name: pseudonym, messageCount: count }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 3);

    // ranks
    const podium: PodiumContact[] = sortedContacts.map((contact, index) => ({
        ...contact,
        rank: index + 1,
    }));

    return podium;
}