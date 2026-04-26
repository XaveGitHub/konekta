/** Current user id in mock data — used for roles and member rows. */
export const CURRENT_USER_ID = "me";

export type GroupMemberRole = "admin" | "member";

export type GroupMember = {
  id: string;
  name: string;
  role: GroupMemberRole;
  avatarUrl?: string | null;
};

export type Chat = {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isMuted?: boolean;
  isPinned?: boolean;
  isGroup?: boolean;
  /** When `isGroup`, your role in this chat (mock/local). */
  myRole?: GroupMemberRole;
  members?: GroupMember[];
  /** Group topic / rules (mock). */
  groupDescription?: string;
  /** Mock invite slug — shown as konekta.link/g/{slug} */
  groupInviteCode?: string;
  avatarUrl?: string | null;
  username?: string;
  /** True for broadcast / public-style channel chats (not a DM or group thread). */
  isChannel?: boolean;
  /** `open` = any subscriber can post; `announce` = only admins post (mock). */
  channelPostPolicy?: "open" | "announce";
  /** Display-only subscriber count for channels. */
  channelSubscriberCount?: number;
  /** True if the user or group is currently online/active. */
  isOnline?: boolean;
  /**
   * Someone not in your contacts sent a message — show in “Request” filter (mock).
   * Distinct from normal unread DMs.
   */
  isMessageRequest?: boolean;
  /** DM only: maps to `MOCK_PROFILES` / `/profile/[userId]`. */
  peerUserId?: string;
};

export const mockChats: Chat[] = [
  {
    id: "1",
    title: "Alice Smith",
    lastMessage: "Are we still on for tomorrow?",
    lastMessageAt: "10:30 AM",
    unreadCount: 2,
    avatarUrl: "https://i.pravatar.cc/150?u=alice",
    username: "@alicesmith",
    peerUserId: "user1",
  },
  {
    id: "2",
    title: "Bob Jones",
    lastMessage: "See you then!",
    lastMessageAt: "09:15 AM",
    unreadCount: 0,
    avatarUrl: "https://i.pravatar.cc/150?u=bob",
    username: "@bobjones",
    isOnline: false,
    peerUserId: "user2",
  },
  {
    id: "3",
    title: "Konekta Dev Team",
    lastMessage: "The new build is ready for testing! Check the internal link.",
    lastMessageAt: "12:45 PM",
    unreadCount: 8,
    isMuted: true,
    isGroup: true,
    myRole: "member",
    username: "@konektateam",
    isOnline: true,
    groupDescription:
      "Internal builds, release notes, and QA coordination. Keep threads on-topic.",
    groupInviteCode: "konekta-dev-7x2",
    members: [
      {
        id: CURRENT_USER_ID,
        name: "You",
        role: "member",
        avatarUrl: null,
      },
      {
        id: "dev",
        name: "Dev Lead",
        role: "admin",
        avatarUrl: "https://i.pravatar.cc/150?u=devlead",
      },
      {
        id: "qa",
        name: "QA Team",
        role: "member",
        avatarUrl: "https://i.pravatar.cc/150?u=qateam",
      },
    ],
  },
  {
    id: "11",
    title: "Design Squad",
    lastMessage: "Alice: Final mocks are in the folder.",
    lastMessageAt: "11:20 AM",
    unreadCount: 3,
    isGroup: true,
    myRole: "admin",
    username: "@designsquad",
    avatarUrl: "https://i.pravatar.cc/150?u=designsquad",
    groupDescription:
      "Product design, UX reviews, and Figma links. Pin important references in chat.",
    groupInviteCode: "design-squad-9qm",
    members: [
      {
        id: CURRENT_USER_ID,
        name: "You",
        role: "admin",
        avatarUrl: null,
      },
      {
        id: "alice",
        name: "Alice Smith",
        role: "admin",
        avatarUrl: "https://i.pravatar.cc/150?u=alice",
      },
      {
        id: "bob",
        name: "Bob Jones",
        role: "member",
        avatarUrl: "https://i.pravatar.cc/150?u=bob",
      },
      {
        id: "carol",
        name: "Carol Reed",
        role: "member",
        avatarUrl: "https://i.pravatar.cc/150?u=carol",
      },
    ],
  },
  {
    id: "4",
    title: "Sarah Wilson",
    lastMessage: "Thanks for the help! I'll see you at the office tomorrow.",
    lastMessageAt: "Yesterday",
    unreadCount: 0,
    avatarUrl: "https://i.pravatar.cc/150?u=sarah",
    username: "@sarahw",
    peerUserId: "user_sarah",
  },
  {
    id: "req-1",
    title: "Jordan Lee",
    lastMessage: "Hey — we met at the meetup. Mind if I reach out here?",
    lastMessageAt: "2:14 PM",
    unreadCount: 1,
    isMessageRequest: true,
    avatarUrl: "https://i.pravatar.cc/150?u=jordanlee",
    username: "@jordanlee",
    peerUserId: "jordan",
  },
  {
    id: "req-2",
    title: "Studio Collective",
    lastMessage: "You were added by a member. Tap to view the group.",
    lastMessageAt: "Mon",
    unreadCount: 2,
    isMessageRequest: true,
    isGroup: true,
    avatarUrl: "https://i.pravatar.cc/150?u=studiotemp",
    username: "@studiocollective",
    myRole: "member",
    members: [
      {
        id: CURRENT_USER_ID,
        name: "You",
        role: "member",
        avatarUrl: null,
      },
      {
        id: "org",
        name: "Studio Collective",
        role: "admin",
        avatarUrl: "https://i.pravatar.cc/150?u=studiotemp",
      },
    ],
  },
  {
    id: "ch1",
    title: "Konekta Updates",
    lastMessage: "🚀 Version 2.1.0 is now live! Check the release notes for what's new.",
    lastMessageAt: "11:00 AM",
    unreadCount: 1,
    isChannel: true,
    channelPostPolicy: "announce",
    channelSubscriberCount: 128_400,
    myRole: "member",
    avatarUrl: "https://i.pravatar.cc/150?u=konekta-channel",
    username: "@konektaupdates",
    groupDescription:
      "Official product updates, release notes, and tips. Low noise — admins post only.",
    members: [
      {
        id: "konekta-team",
        name: "Konekta",
        role: "admin",
        avatarUrl: "https://i.pravatar.cc/150?u=konekta-channel",
      },
    ],
  },
  {
    id: "ch2",
    title: "Tech News Daily",
    lastMessage: "OpenAI just published their Q1 report. The numbers are surprising...",
    lastMessageAt: "Yesterday",
    unreadCount: 0,
    isChannel: true,
    channelPostPolicy: "open",
    channelSubscriberCount: 89_200,
    myRole: "member",
    avatarUrl: "https://i.pravatar.cc/150?u=technews",
    username: "@technewsdaily",
    groupDescription:
      "Community discussion on tech headlines. Be kind, cite sources, no spam.",
    members: [
      {
        id: "tn-editor",
        name: "TN Editors",
        role: "admin",
        avatarUrl: "https://i.pravatar.cc/150?u=tneditors",
      },
      {
        id: "tn-mod",
        name: "Mods",
        role: "admin",
        avatarUrl: "https://i.pravatar.cc/150?u=tnmods",
      },
    ],
  },
];
