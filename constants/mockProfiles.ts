import { CURRENT_USER_ID } from "@/constants/mockChats";

export type SubscriptionTier = "free" | "plus" | "pro";

/** Public user card — mock until Clerk + Neon/Postgres. */
export type UserProfile = {
  id: string;
  displayName: string;
  username: string;
  phone?: string;
  bio?: string;
  birthday?: string; // ISO string or YYYY-MM-DD
  avatarUrl?: string | null;
  /** Mock: free = “removed a message” tombstones; plus = delete without trace, silent leave, etc. */
  subscriptionTier?: SubscriptionTier;
};

const U = (p: UserProfile) => p;

/**
 * Profiles keyed by stable user id (matches `peerUserId` on DMs, `GroupMember.id`, message `senderId` where applicable).
 */
export const MOCK_PROFILES: Record<string, UserProfile> = {
  [CURRENT_USER_ID]: U({
    id: CURRENT_USER_ID,
    displayName: "Gizmo",
    username: "@gizmo",
    phone: "+1 (555) 123-4567",
    bio: "Building Konekta.",
    birthday: "1994-11-20",
    avatarUrl: "https://i.pravatar.cc/150?u=currentuser123",
    subscriptionTier: "free",
  }),
  user1: U({
    id: "user1",
    displayName: "Alice Smith",
    username: "@alicesmith",
    phone: "+1 (555) 201-0001",
    bio: "Product · SF",
    avatarUrl: "https://i.pravatar.cc/150?u=alice",
  }),
  user2: U({
    id: "user2",
    displayName: "Bob Jones",
    username: "@bobjones",
    phone: "+1 (555) 201-0004",
    bio: "Usually reachable on chat.",
    avatarUrl: "https://i.pravatar.cc/150?u=bob",
  }),
  user_sarah: U({
    id: "user_sarah",
    displayName: "Sarah Wilson",
    username: "@sarahw",
    phone: "+1 (555) 201-0099",
    bio: "Office days Tue–Thu",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah",
  }),
  jordan: U({
    id: "jordan",
    displayName: "Jordan Lee",
    username: "@jordanlee",
    phone: "+1 (555) 201-0142",
    bio: "Met at the meetup ✌️",
    avatarUrl: "https://i.pravatar.cc/150?u=jordanlee",
  }),
  dev: U({
    id: "dev",
    displayName: "Dev Lead",
    username: "@devlead",
    bio: "Ships builds, breaks nothing (almost).",
    avatarUrl: "https://i.pravatar.cc/150?u=devlead",
  }),
  qa: U({
    id: "qa",
    displayName: "QA Team",
    username: "@qateam",
    bio: "Quality over quantity.",
    avatarUrl: "https://i.pravatar.cc/150?u=qateam",
  }),
  alice: U({
    id: "alice",
    displayName: "Alice Smith",
    username: "@alicesmith",
    phone: "+1 (555) 201-0001",
    bio: "Design Squad admin",
    avatarUrl: "https://i.pravatar.cc/150?u=alice",
  }),
  bob: U({
    id: "bob",
    displayName: "Bob Jones",
    username: "@bobjones",
    avatarUrl: "https://i.pravatar.cc/150?u=bob",
  }),
  carol: U({
    id: "carol",
    displayName: "Carol Reed",
    username: "@carolreed",
    avatarUrl: "https://i.pravatar.cc/150?u=carol",
  }),
  org: U({
    id: "org",
    displayName: "Studio Collective",
    username: "@studiocollective",
    bio: "Group admin (mock)",
    avatarUrl: "https://i.pravatar.cc/150?u=studiotemp",
  }),
};

export function getUserProfile(userId: string): UserProfile | undefined {
  return MOCK_PROFILES[userId];
}

export function initialCurrentUserProfile(): UserProfile {
  const base = MOCK_PROFILES[CURRENT_USER_ID];
  return { ...base };
}
