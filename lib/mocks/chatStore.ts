/**
 * Pretend “server” for chats + message threads.
 * Screens should not import MOCK_* / mockChats directly — use this module or ChatContext.
 */
import { mockChats, CURRENT_USER_ID, type Chat } from '@/constants/mockChats';
import { MOCK_MESSAGES, type Message } from '@/constants/mockMessages';

export type { Chat } from '@/constants/mockChats';
export type { Message, MessageReplyPreview } from '@/constants/mockMessages';
export { CURRENT_USER_ID } from '@/constants/mockChats';

/** Fresh chat list (shallow copy of top-level chat objects). */
export function bootstrapChats(): Chat[] {
  return mockChats.map((c) => ({ ...c }));
}

/** Deep clone of seed threads so React state can mutate safely. */
export function bootstrapMessagesByChatId(): Record<string, Message[]> {
  return structuredClone(MOCK_MESSAGES) as Record<string, Message[]>;
}

/** Read-only seed thread for a chat (e.g. previews before context is available). */
export function getSeedMessagesForChat(chatId: string): Message[] {
  return MOCK_MESSAGES[chatId] ?? [];
}

/** Resolve a chat from seed data by id (fallback when context list omits it). */
export function findSeedChatById(chatId: string): Chat | undefined {
  return mockChats.find((c) => c.id === chatId);
}

export async function loadInitialChats(): Promise<Chat[]> {
  return Promise.resolve(bootstrapChats());
}

export async function loadInitialMessagesByChatId(): Promise<
  Record<string, Message[]>
> {
  return Promise.resolve(bootstrapMessagesByChatId());
}
