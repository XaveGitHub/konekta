export type Contact = {
  id: string;
  name: string;
  username: string;
  phone: string;
  avatarUrl?: string;
  status?: string;
  isOnline?: boolean;
  /** If this contact has an existing chat, this links to it */
  chatId?: string;
  /** When set, opens `/profile/[profileUserId]` (mock profiles only). */
  profileUserId?: string;
};

export type ContactSection = {
  letter: string;
  data: Contact[];
};

export const mockContacts: Contact[] = [
  {
    id: "c1",
    name: "Alice Smith",
    username: "@alicesmith",
    phone: "+1 (555) 201-0001",
    avatarUrl: "https://i.pravatar.cc/150?u=alice",
    status: "Available",
    isOnline: true,
    chatId: "1",
    profileUserId: "user1",
  },
  { id: "c2", name: "Aaron Zhang", username: "@aaronz", phone: "+1 (555) 201-0002", avatarUrl: "https://i.pravatar.cc/150?u=aaronz", status: "In a meeting", isOnline: false },
  { id: "c3", name: "Amara Diallo", username: "@amara_d", phone: "+1 (555) 201-0003", avatarUrl: "https://i.pravatar.cc/150?u=amara", status: "🎵 Listening to music", isOnline: true },
  {
    id: "c4",
    name: "Bob Jones",
    username: "@bobjones",
    phone: "+1 (555) 201-0004",
    avatarUrl: "https://i.pravatar.cc/150?u=bob",
    status: "Hey there!",
    isOnline: false,
    chatId: "2",
    profileUserId: "user2",
  },
  { id: "c5", name: "Bianca Reyes", username: "@bianca_r", phone: "+1 (555) 201-0005", avatarUrl: "https://i.pravatar.cc/150?u=bianca", status: "Busy", isOnline: false },
  { id: "c6", name: "Carlos Mendez", username: "@carlosm", phone: "+1 (555) 201-0006", avatarUrl: "https://i.pravatar.cc/150?u=carlos", status: "Available", isOnline: true },
  { id: "c7", name: "Chloe Kim", username: "@chloek", phone: "+1 (555) 201-0007", avatarUrl: "https://i.pravatar.cc/150?u=chloe", status: "At the gym 💪", isOnline: true },
  { id: "c8", name: "David Park", username: "@davidp", phone: "+1 (555) 201-0008", avatarUrl: "https://i.pravatar.cc/150?u=david", status: "Working remotely", isOnline: false },
  { id: "c9", name: "Diana Foster", username: "@dianaf", phone: "+1 (555) 201-0009", avatarUrl: "https://i.pravatar.cc/150?u=diana", status: "📚 Reading", isOnline: false },
  { id: "c10", name: "Elena Novak", username: "@elenan", phone: "+1 (555) 201-0010", avatarUrl: "https://i.pravatar.cc/150?u=elena", status: "Available", isOnline: true },
  { id: "c11", name: "Ethan Cole", username: "@ethanc", phone: "+1 (555) 201-0011", avatarUrl: "https://i.pravatar.cc/150?u=ethan", status: "Sleeping 😴", isOnline: false },
  { id: "c12", name: "Fatima Al-Hassan", username: "@fatimah", phone: "+1 (555) 201-0012", avatarUrl: "https://i.pravatar.cc/150?u=fatima", status: "🌙 Away", isOnline: false },
  { id: "c13", name: "George Sullivan", username: "@georges", phone: "+1 (555) 201-0013", avatarUrl: "https://i.pravatar.cc/150?u=george", status: "Around", isOnline: true },
  { id: "c14", name: "Hannah Lee", username: "@hannahlei", phone: "+1 (555) 201-0014", avatarUrl: "https://i.pravatar.cc/150?u=hannahlee", status: "Hiking ⛰️", isOnline: false },
  { id: "c15", name: "Ivan Petrov", username: "@ivanp", phone: "+1 (555) 201-0015", avatarUrl: "https://i.pravatar.cc/150?u=ivan", status: "Available", isOnline: true },
  { id: "c16", name: "Jasmine Okafor", username: "@jasmineo", phone: "+1 (555) 201-0016", avatarUrl: "https://i.pravatar.cc/150?u=jasmine", status: "Driving 🚗", isOnline: false },
  { id: "c17", name: "James Liu", username: "@jamesl", phone: "+1 (555) 201-0017", avatarUrl: "https://i.pravatar.cc/150?u=jamesliu", status: "Available", isOnline: true },
  { id: "c18", name: "Kayla Nguyen", username: "@kaylan", phone: "+1 (555) 201-0018", avatarUrl: "https://i.pravatar.cc/150?u=kayla", status: "Cooking 🍳", isOnline: false },
  { id: "c19", name: "Lucas Ferreira", username: "@lucasf", phone: "+1 (555) 201-0019", avatarUrl: "https://i.pravatar.cc/150?u=lucas", status: "Available", isOnline: true },
  { id: "c20", name: "Lily Chen", username: "@lilyc", phone: "+1 (555) 201-0020", avatarUrl: "https://i.pravatar.cc/150?u=lilychen", status: "At home", isOnline: true },
  { id: "c21", name: "Marcus Adebayo", username: "@marcusa", phone: "+1 (555) 201-0021", avatarUrl: "https://i.pravatar.cc/150?u=marcus", status: "At work", isOnline: true },
  { id: "c22", name: "Mia Tanaka", username: "@miat", phone: "+1 (555) 201-0022", avatarUrl: "https://i.pravatar.cc/150?u=mia", status: "🎮 Gaming", isOnline: true },
  { id: "c23", name: "Nathan Brooks", username: "@nathanb", phone: "+1 (555) 201-0023", avatarUrl: "https://i.pravatar.cc/150?u=nathan", status: "Away", isOnline: false },
  { id: "c24", name: "Olivia Russo", username: "@oliviar", phone: "+1 (555) 201-0024", avatarUrl: "https://i.pravatar.cc/150?u=olivia", status: "Available", isOnline: true },
  { id: "c25", name: "Omar Khalil", username: "@omark", phone: "+1 (555) 201-0025", avatarUrl: "https://i.pravatar.cc/150?u=omar", status: "Busy", isOnline: false },
  { id: "c26", name: "Priya Sharma", username: "@priyas", phone: "+1 (555) 201-0026", avatarUrl: "https://i.pravatar.cc/150?u=priya", status: "In a call 📞", isOnline: false },
  { id: "c27", name: "Quinn Torres", username: "@quinnt", phone: "+1 (555) 201-0027", avatarUrl: "https://i.pravatar.cc/150?u=quinn", status: "Available", isOnline: true },
  { id: "c28", name: "Ryan O'Brien", username: "@ryano", phone: "+1 (555) 201-0028", avatarUrl: "https://i.pravatar.cc/150?u=ryan", status: "At work", isOnline: true },
  { id: "c29", name: "Sofia Vargas", username: "@sofiav", phone: "+1 (555) 201-0029", avatarUrl: "https://i.pravatar.cc/150?u=sofia", status: "Out for lunch 🍜", isOnline: false },
  { id: "c30", name: "Tiffany Wu", username: "@tiffanyw", phone: "+1 (555) 201-0030", avatarUrl: "https://i.pravatar.cc/150?u=tiffany", status: "Available", isOnline: true },
  { id: "c31", name: "Tyler Johnson", username: "@tylerj", phone: "+1 (555) 201-0031", avatarUrl: "https://i.pravatar.cc/150?u=tyler", status: "🏀 Playing basketball", isOnline: false },
  { id: "c32", name: "Uma Patel", username: "@umap", phone: "+1 (555) 201-0032", avatarUrl: "https://i.pravatar.cc/150?u=uma", status: "Available", isOnline: true },
  { id: "c33", name: "Victor Osei", username: "@victoro", phone: "+1 (555) 201-0033", avatarUrl: "https://i.pravatar.cc/150?u=victor", status: "Traveling ✈️", isOnline: false },
  { id: "c34", name: "Wendy Huang", username: "@wendyh", phone: "+1 (555) 201-0034", avatarUrl: "https://i.pravatar.cc/150?u=wendy", status: "At home", isOnline: true },
  { id: "c35", name: "Xavier Dubois", username: "@xavierd", phone: "+1 (555) 201-0035", avatarUrl: "https://i.pravatar.cc/150?u=xavier", status: "Unavailable", isOnline: false },
  { id: "c36", name: "Yuki Yamamoto", username: "@yukiy", phone: "+1 (555) 201-0036", avatarUrl: "https://i.pravatar.cc/150?u=yuki", status: "🌸 Available", isOnline: true },
  { id: "c37", name: "Zara Okonkwo", username: "@zarao", phone: "+1 (555) 201-0037", avatarUrl: "https://i.pravatar.cc/150?u=zara", status: "Busy", isOnline: false },
  {
    id: "c38",
    name: "Sarah Wilson",
    username: "@sarahw",
    phone: "+1 (555) 201-0099",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah",
    status: "Office days Tue–Thu",
    isOnline: false,
    chatId: "4",
    profileUserId: "user_sarah",
  },
];

/** Groups contacts alphabetically into SectionList-compatible data */
export function getContactSections(): ContactSection[] {
  const sorted = [...mockContacts].sort((a, b) => a.name.localeCompare(b.name));
  const map = new Map<string, Contact[]>();

  for (const contact of sorted) {
    const letter = contact.name[0].toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(contact);
  }

  return Array.from(map.entries()).map(([letter, data]) => ({ letter, data }));
}
