import type { Chat } from '@/lib/mocks/chatStore';

/** Announce-style channels: only admins post (mock). */
export function isChannelComposerReadOnly(chat: Chat | undefined): boolean {
  if (!chat?.isChannel) return false;
  if (chat.channelPostPolicy !== 'announce') return false;
  return chat.myRole !== 'admin';
}

export function channelComposerLockMessage(): string {
  return 'this is a read-only broadcast channel';
}

export function formatChannelSubscribers(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return 'Subscribers';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M subscribers`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k subscribers`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k subscribers`;
  return `${n.toLocaleString()} subscribers`;
}

export function channelPostPolicyLabel(policy: Chat['channelPostPolicy']): string {
  if (policy === 'announce') return 'Admins only · announce';
  return 'Everyone can post';
}
