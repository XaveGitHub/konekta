import type { Chat, Message } from "@/lib/mocks/chatStore";
import { getSeedMessagesForChat } from "@/lib/mocks/chatStore";
import {
  channelPostPolicyLabel,
  formatChannelSubscribers,
} from "@/lib/channel";

function messageSnippet(m: Message): string {
  switch (m.type) {
    case "text":
      return m.text?.trim() || "Message";
    case "image":
      return m.mediaUrls?.length ? `${m.mediaUrls.length} photos` : "Photo";
    case "video":
      return "Video";
    case "file":
      return m.fileName || "File";
    case "audio":
      return "Voice message";
    case "location":
      return m.locationLabel || "Location";
    case "system":
      return m.text?.trim() || "Update";
    default:
      return "Message";
  }
}

/** List preview for the latest message (groups: "Name: …" / "You: …"). */
export function formatLastMessagePreview(chat: Chat, last: Message): string {
  const snippet = messageSnippet(last);
  if (last.type === "system") {
    return snippet;
  }
  if (chat.isChannel) {
    if (last.isMe) return `You: ${snippet}`;
    const member = chat.members?.find((x) => x.id === last.senderId);
    const label = member?.name ?? chat.title;
    return `${label}: ${snippet}`;
  }
  if (!chat.isGroup) {
    if (last.type === "text" && last.text?.trim()) return last.text.trim();
    return snippet;
  }
  if (last.isMe) return `You: ${snippet}`;
  const member = chat.members?.find((x) => x.id === last.senderId);
  const label = member?.name ?? "Member";
  return `${label}: ${snippet}`;
}

/**
 * Second line on the chat list.
 * Pass `threadMessages` from ChatContext when available so previews match live sends.
 */
export function getChatListPreviewLine(
  chat: Chat,
  threadMessages?: Message[] | null,
): string {
  const msgs =
    threadMessages && threadMessages.length > 0
      ? threadMessages
      : getSeedMessagesForChat(chat.id);
  if (msgs.length) {
    const last = msgs.reduce((a, b) =>
      a.fullTimestamp >= b.fullTimestamp ? a : b,
    );
    return formatLastMessagePreview(chat, last);
  }
  return chat.lastMessage;
}

/** Optional meta under the title for groups (member count + admin). */
export function getGroupMetaLine(chat: Chat): string | null {
  if (!chat.isGroup) return null;
  const n = chat.members?.length ?? 0;
  if (n === 0) return "Group";
  return `${n} member${n === 1 ? "" : "s"}${
    chat.myRole === "admin" ? " · Admin" : ""
  }`;
}

/** Optional meta under the title for channels (subscribers + post policy). */
export function getChannelMetaLine(chat: Chat): string | null {
  if (!chat.isChannel) return null;
  const subs = formatChannelSubscribers(chat.channelSubscriberCount);
  const policy = channelPostPolicyLabel(chat.channelPostPolicy);
  return `${subs} · ${policy}`;
}
