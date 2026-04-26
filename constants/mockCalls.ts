export type CallType = "audio" | "video";
export type CallDirection = "incoming" | "outgoing" | "missed";

export type CallRecord = {
  id: string;
  contactName: string;
  avatarUrl?: string;
  type: CallType;
  direction: CallDirection;
  /** Duration in seconds — undefined for missed calls */
  duration?: number;
  /** Display timestamp string */
  timestamp: string;
  /** Used to group calls into sections */
  dateGroup: "Today" | "Yesterday" | "Monday" | "Sunday" | "Last week";
  /** If the contact has an existing chat, links to it */
  chatId?: string;
};

export const mockCalls: CallRecord[] = [
  { id: "c1", contactName: "Alice Smith", avatarUrl: "https://i.pravatar.cc/150?u=alice", type: "video", direction: "outgoing", duration: 342, timestamp: "10:30 AM", dateGroup: "Today", chatId: "1" },
  { id: "c2", contactName: "Bob Jones", avatarUrl: "https://i.pravatar.cc/150?u=bob", type: "audio", direction: "missed", timestamp: "9:15 AM", dateGroup: "Today", chatId: "2" },
  { id: "c3", contactName: "Mia Tanaka", avatarUrl: "https://i.pravatar.cc/150?u=mia", type: "audio", direction: "incoming", duration: 128, timestamp: "8:02 AM", dateGroup: "Today" },
  { id: "c4", contactName: "Carlos Mendez", avatarUrl: "https://i.pravatar.cc/150?u=carlos", type: "video", direction: "incoming", duration: 2134, timestamp: "7:45 PM", dateGroup: "Yesterday" },
  { id: "c5", contactName: "Alice Smith", avatarUrl: "https://i.pravatar.cc/150?u=alice", type: "audio", direction: "outgoing", duration: 56, timestamp: "3:20 PM", dateGroup: "Yesterday", chatId: "1" },
  { id: "c6", contactName: "Olivia Russo", avatarUrl: "https://i.pravatar.cc/150?u=olivia", type: "audio", direction: "missed", timestamp: "11:00 AM", dateGroup: "Yesterday" },
  { id: "c7", contactName: "Lucas Ferreira", avatarUrl: "https://i.pravatar.cc/150?u=lucas", type: "video", direction: "outgoing", duration: 890, timestamp: "2:15 PM", dateGroup: "Monday" },
  { id: "c8", contactName: "Diana Foster", avatarUrl: "https://i.pravatar.cc/150?u=diana", type: "audio", direction: "incoming", duration: 445, timestamp: "9:30 AM", dateGroup: "Monday" },
  { id: "c9", contactName: "Bob Jones", avatarUrl: "https://i.pravatar.cc/150?u=bob", type: "audio", direction: "outgoing", duration: 1203, timestamp: "6:45 PM", dateGroup: "Sunday", chatId: "2" },
  { id: "c10", contactName: "Yuki Yamamoto", avatarUrl: "https://i.pravatar.cc/150?u=yuki", type: "video", direction: "missed", timestamp: "4:00 PM", dateGroup: "Sunday" },
  { id: "c11", contactName: "George Sullivan", avatarUrl: "https://i.pravatar.cc/150?u=george", type: "audio", direction: "incoming", duration: 611, timestamp: "11:30 AM", dateGroup: "Last week" },
  { id: "c12", contactName: "Priya Sharma", avatarUrl: "https://i.pravatar.cc/150?u=priya", type: "video", direction: "missed", timestamp: "9:00 AM", dateGroup: "Last week" },
];

/** Groups calls into SectionList-compatible sections */
export type CallSection = { dateGroup: string; data: CallRecord[] };

export function getCallSections(): CallSection[] {
  const order = ["Today", "Yesterday", "Monday", "Sunday", "Last week"];
  const map = new Map<string, CallRecord[]>();
  for (const call of mockCalls) {
    if (!map.has(call.dateGroup)) map.set(call.dateGroup, []);
    map.get(call.dateGroup)!.push(call);
  }
  return order.filter((g) => map.has(g)).map((g) => ({ dateGroup: g, data: map.get(g)! }));
}

/** Format duration in seconds to e.g. "5:42" */
export function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
