import type { Message, MessageReplyPreview } from "@/lib/mocks/chatStore";

export function messageToReplyPreview(
  m: Message,
  peerName?: string,
): MessageReplyPreview {
  return {
    id: m.id,
    senderName: m.isMe ? "You" : peerName ?? "Contact",
    type: m.type,
    text: m.text,
    mediaUrl: m.mediaUrl,
  };
}

export function replyPreviewSnippet(r: MessageReplyPreview): string {
  switch (r.type) {
    case "text":
      return r.text ?? "";
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "audio":
      return "Voice message";
    case "file":
      return "File";
    case "location":
      return "Location";
    default:
      return "";
  }
}
