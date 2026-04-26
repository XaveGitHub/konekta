export type MessageKind =
  | "text"
  | "image"
  | "video"
  | "file"
  | "audio"
  | "location"
  | "system";

/** Snapshot for quoted replies (Telegram / Messenger style). */
export type MessageReplyPreview = {
  id: string;
  senderName: string;
  type: MessageKind;
  text?: string;
  mediaUrl?: string;
};

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  timestamp: string;      // Display time (e.g., "10:30 AM")
  date: string;           // Sortable date string (e.g., "2024-03-18")
  fullTimestamp: number;  // For sorting
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: MessageKind;
  isMe: boolean;
  mediaUrl?: string;     // For single image or file
  mediaUrls?: string[];  // For multi-image messages
  mediaAspectRatio?: number; // Tracks true dimensions of sent photos/videos
  fileName?: string;     // For file messages
  fileSize?: string;     // For file messages
  reactions?: { emoji: string; count: number; me: boolean }[];
  replyTo?: MessageReplyPreview;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
}

export const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    // --- YESTERDAY'S MESSAGES ---
    {
      id: 'm_old_1',
      chatId: '1',
      senderId: 'user1',
      text: 'Hey! Did you get around to looking at the proposal?',
      timestamp: '04:20 PM',
      date: '2026-03-17', // Yesterday
      fullTimestamp: 1710692400,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'm_old_2',
      chatId: '1',
      senderId: 'me',
      text: 'Not yet, just getting off a long meeting. Will check tonight!',
      timestamp: '05:10 PM',
      date: '2026-03-17',
      fullTimestamp: 1710695400,
      status: 'read',
      type: 'text',
      isMe: true,
    },
    {
      id: 'm_old_3',
      chatId: '1',
      senderId: 'user1',
      text: 'No rush. Talk tomorrow!',
      timestamp: '05:15 PM',
      date: '2026-03-17',
      fullTimestamp: 1710695700,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    // --- TODAY'S MESSAGES ---
    {
      id: 'm1',
      chatId: '1',
      senderId: 'user1',
      text: 'Hey! Are we still on for tomorrow?',
      timestamp: '10:30 AM',
      date: '2026-03-18', // Today
      fullTimestamp: 1710757800,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'm2',
      chatId: '1',
      senderId: 'me',
      text: 'Definitely! What time were you thinking?',
      timestamp: '10:32 AM',
      date: '2026-03-18',
      fullTimestamp: 1710757920,
      status: 'read',
      type: 'text',
      isMe: true,
    },
    {
      id: 'm3',
      chatId: '1',
      senderId: 'user1',
      text: 'I have a PDF of the proposal we discussed. Checking it now.',
      timestamp: '10:34 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758040,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'm3_file',
      chatId: '1',
      senderId: 'user1',
      timestamp: '10:34 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758041,
      status: 'read',
      type: 'file',
      fileName: 'Project_Proposal_V2.pdf',
      fileSize: '2.4 MB',
      isMe: false,
    },
    {
      id: 'm4',
      chatId: '1',
      senderId: 'me',
      text: '11 AM works perfectly for me. Look at this place I found for the coffee shop!',
      timestamp: '10:36 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758160,
      status: 'read',
      type: 'text',
      isMe: true,
    },
    {
      id: 'm4_image',
      chatId: '1',
      senderId: 'me',
      timestamp: '10:36 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758161,
      status: 'read',
      type: 'image',
      mediaUrl: 'https://picsum.photos/800/600?random=1',
      isMe: true,
    },
    {
      id: 'm5',
      chatId: '1',
      senderId: 'user1',
      text: 'That looks amazing! Here are some other options for lunch after.',
      timestamp: '10:40 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758400,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'm5_images',
      chatId: '1',
      senderId: 'user1',
      timestamp: '10:41 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758460,
      status: 'read',
      type: 'image',
      mediaUrls: [
        'https://picsum.photos/400/400?random=2',
        'https://picsum.photos/400/400?random=3',
        'https://picsum.photos/400/400?random=4',
      ],
      isMe: false,
    },
    {
      id: 'm6',
      chatId: '1',
      senderId: 'me',
      text: 'Let\'s go with the second one. The menu looks great.',
      timestamp: '10:42 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758520,
      status: 'read',
      type: 'text',
      isMe: true,
    },
    {
      id: 'm7',
      chatId: '1',
      senderId: 'user1',
      text: 'Perfect. See you then! 👋',
      timestamp: '10:45 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758700,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'm8',
      chatId: '1',
      senderId: 'me',
      text: 'Wait, should I bring my laptop?',
      timestamp: '10:46 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758760,
      status: 'read',
      type: 'text',
      isMe: true,
    },
    {
      id: 'm9',
      chatId: '1',
      senderId: 'user1',
      text: 'Nah, don\'t worry about it. Just brainstorming session.',
      timestamp: '10:47 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758820,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'm10',
      chatId: '1',
      senderId: 'me',
      text: 'Cool. See ya!',
      timestamp: '10:48 AM',
      date: '2026-03-18',
      fullTimestamp: 1710758880,
      status: 'read',
      type: 'text',
      isMe: true,
    },
    {
      id: 'm_audio_1',
      chatId: '1',
      senderId: 'user1',
      timestamp: '11:05 AM',
      date: '2026-03-18',
      fullTimestamp: 1710759900,
      status: 'read',
      type: 'audio',
      mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      isMe: false,
    },
    {
      id: 'm_location_1',
      chatId: '1',
      senderId: 'me',
      timestamp: '11:10 AM',
      date: '2026-03-18',
      fullTimestamp: 1710760200,
      status: 'delivered',
      type: 'location',
      isMe: true,
      latitude: 40.7128,
      longitude: -74.006,
      locationLabel: 'New York, NY',
      text: 'New York, NY',
    }
  ],
  '2': [
    {
      id: 'm6',
      chatId: '2',
      senderId: 'user2',
      text: 'See you then!',
      timestamp: '09:15 AM',
      date: '2026-03-18',
      fullTimestamp: 1710753300,
      status: 'read',
      type: 'text',
      isMe: false,
    }
  ],
  '3': [
    {
      id: 'm7',
      chatId: '3',
      senderId: 'dev',
      text: 'The new build is ready for testing. Please let me know what you think!',
      timestamp: '12:45 PM',
      date: '2026-03-18',
      fullTimestamp: 1710765900,
      status: 'delivered',
      type: 'text',
      isMe: false,
    },
  ],
  '11': [
    {
      id: 'm11_1',
      chatId: '11',
      senderId: 'alice',
      text: 'Final mocks are in the folder.',
      timestamp: '11:20 AM',
      date: '2026-03-18',
      fullTimestamp: 1710760800,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'm11_2',
      chatId: '11',
      senderId: 'me',
      text: 'Thanks — reviewing now.',
      timestamp: '11:22 AM',
      date: '2026-03-18',
      fullTimestamp: 1710760920,
      status: 'read',
      type: 'text',
      isMe: true,
    },
  ],
  'req-1': [
    {
      id: 'rq1-1',
      chatId: 'req-1',
      senderId: 'jordan',
      text: 'Hey — we met at the meetup. Mind if I reach out here?',
      timestamp: '2:14 PM',
      date: '2026-03-31',
      fullTimestamp: 1711890840,
      status: 'delivered',
      type: 'text',
      isMe: false,
    },
  ],
  'req-2': [
    {
      id: 'rq2-1',
      chatId: 'req-2',
      senderId: 'org',
      text: 'You were added by a member. Messages you send are visible to the group.',
      timestamp: '9:00 AM',
      date: '2026-03-31',
      fullTimestamp: 1711875600,
      status: 'delivered',
      type: 'text',
      isMe: false,
    },
  ],
  ch1: [
    {
      id: 'ch1_m1',
      chatId: 'ch1',
      senderId: 'konekta-team',
      text: "🚀 Version 2.1.0 is now live! Check the release notes for what's new.",
      timestamp: '11:00 AM',
      date: '2026-03-31',
      fullTimestamp: 1711892400,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'ch1_m2',
      chatId: 'ch1',
      senderId: 'konekta-team',
      text: 'Tip: long-press any message to react or reply. Channels support the same bubbles as DMs (mock).',
      timestamp: '10:12 AM',
      date: '2026-03-31',
      fullTimestamp: 1711888320,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'ch1_m3',
      chatId: 'ch1',
      senderId: 'konekta-team',
      text: 'Weekly digest: 3 new quality-of-life fixes on Android keyboards and haptics.',
      timestamp: 'Mon',
      date: '2026-03-29',
      fullTimestamp: 1711713600,
      status: 'read',
      type: 'text',
      isMe: false,
    },
  ],
  ch2: [
    {
      id: 'ch2_m1',
      chatId: 'ch2',
      senderId: 'tn-editor',
      text: 'OpenAI just published their Q1 report. The numbers are surprising — thread your takes below.',
      timestamp: 'Yesterday',
      date: '2026-03-30',
      fullTimestamp: 1711800000,
      status: 'read',
      type: 'text',
      isMe: false,
    },
    {
      id: 'ch2_m2',
      chatId: 'ch2',
      senderId: 'me',
      text: 'Interesting read. The inference cost section is worth a closer look.',
      timestamp: 'Yesterday',
      date: '2026-03-30',
      fullTimestamp: 1711801200,
      status: 'read',
      type: 'text',
      isMe: true,
    },
    {
      id: 'ch2_m3',
      chatId: 'ch2',
      senderId: 'tn-mod',
      text: 'Reminder: keep it civil and link primary sources when citing stats.',
      timestamp: 'Yesterday',
      date: '2026-03-30',
      fullTimestamp: 1711802400,
      status: 'read',
      type: 'text',
      isMe: false,
    },
  ],
};

