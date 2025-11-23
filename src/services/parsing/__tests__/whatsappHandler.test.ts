import { makeArrayOfMessages, parseMessages, determineDonorName, deIdentify } from '../path/to/your/module';
import { describe, it, expect } from '@jest/globals';

// Fixtures for testing
const fixtureMessages = [
    { text: 'Hello', author: 'John Doe', date: '2025-11-23 17:24:55' },
    // Add more fixtures as needed
];

describe('WhatsApp Handler Tests', () => {
    describe('makeArrayOfMessages', () => {
        it('should handle multiline messages correctly', () => {
            const messages = makeArrayOfMessages('Hello\nHow are you?');
            expect(messages).toEqual([
                { text: 'Hello', type: 'text' },
                { text: 'How are you?', type: 'text' }
            ]);
        });
    });

    describe('parseMessages', () => {
        it('should parse date and time correctly', () => {
            const parsed = parseMessages(fixtureMessages);
            expect(parsed[0].date).toBeInstanceOf(Date);
        });
        it('should extract author correctly', () => {
            const parsed = parseMessages(fixtureMessages);
            expect(parsed[0].author).toBe('John Doe');
        });
    });

    describe('determineDonorName', () => {
        it('should determine donor name with intersection cases', () => {
            const name = determineDonorName('John Doe', ['John Doe', 'Jane Smith']);
            expect(name).toBe('John Doe');
        });
        it('should fallback to default if donor not found', () => {
            const name = determineDonorName('Unknown Donor', ['John Doe']);
            expect(name).toBe('Anonymous');
        });
    });

    describe('deIdentify', () => {
        it('should generate pseudonym for message', () => {
            const pseudonym = deIdentify('John Doe');
            expect(pseudonym).toMatch(/Anonymous/);
        });
        it('should process messages without donor correctly', () => {
            const result = deIdentify('Message without donor');
            expect(result).toBe('Message without donor');
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing donor', () => {
            const result = determineDonorName(null, []);
            expect(result).toBe('Anonymous');
        });
        it('should handle too few chats', () => {
            const result = parseMessages([]);
            expect(result).toEqual([]);
        });
        it('should filter out system messages', () => {
            const messages = makeArrayOfMessages('System Message');
            expect(messages).toHaveLength(0);
        });
        it('should handle various date formats', () => {
            const parsed1 = parseMessages([{ text: 'Sample', date: '23/11/2025' }]);
            const parsed2 = parseMessages([{ text: 'Sample', date: '11/23/2025 PM' }]);
            expect(parsed1[0].date).toBeInstanceOf(Date);
            expect(parsed2[0].date).toBeInstanceOf(Date);
        });
    });
});