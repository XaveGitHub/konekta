# Konekta — System overview

One place to see **what the app is**, **what exists in the repo**, **how we structure code**, and **what to do next**. Update this file when you add major routes, contexts, or data patterns.

---

## How to use this document

| If you want to… | Read |
|-----------------|------|
| Onboard quickly | §1 What the system is, §4 Route map, §7 Quick reference |
| Know what “mock” means here | §2 Mock data (plain language) |
| Follow our file rules | §5 Architecture rules |
| Plan the next refactor | §6 Applying `lib/mocks` (checklist) — **do after this doc stays accurate** |
| See backlog ideas | §9 Plan & backlog |
| Sync cursor, ads caps, grace UX, v1 limits, Phase 1 QA | §8 Target sync & policy (preview) |

**Anti-drift:** Do **not** copy long §8 blocks (comparator + `compareMessageId`, remote-config keys/integers, grace allow/block + banner copy, v1 limits list, Phase 1 QA checklist) into other docs. If another write-up needs the same rule, add a **one-line** summary and **link** to the matching **§8.x** subsection here.

---

## 1. What the system is

**Konekta** is a **UI-first** Expo + React Native messaging app:

- **Expo Router** (`app/`) for navigation  
- **NativeWind** for styling  
- **No real backend yet** — chats, messages, contacts, and calls are driven by **in-app fake data** and **React state** (see §2)  
- Later targets: **Clerk** (auth), **Convex** (realtime + persistence), real calling — **not wired in screens yet**  
- **Implementation preview:** composite message cursor, remote-config ad caps, entitlement grace UX, v1 limitations, and **Phase 1 QA checklist** → **[§8](#8-target-sync--policy-preview)**

**Product feel:** iOS-inspired, readable; glass/blur mainly on headers, tabs, sheets — **not** on message bubbles.

**Phase:** UI-first. Ship polished flows on mock data; keep seams clean so swapping data sources does not require rewriting every screen.

---

## 2. Mock data (what we mean)

**“Mock”** here means: **the app behaves like a real messenger, but the server is pretend.**

- **Static seeds** live in `constants/` (e.g. initial chat list, message threads, contacts).  
- **Runtime changes** (send message, archive, mute, edit profile) live in **React state**, mostly inside **`ChatContext`** and **`ContactsContext`** — still “fake,” but interactive.  
- Nothing hits a real API, database, or auth provider in production code paths.

**Why we talk about `lib/mocks` later:** Today some files import `MOCK_MESSAGES` or `mockChats` **directly**. The goal is to move all **read/write of pretend data** behind a small module (`lib/mocks/*`) so that when you add Convex, you replace **one layer**, not twenty imports. See §6.

**Not mock:** UI components, navigation, gestures, themes — those are real app code.

---

## 3. Tech stack

| Area | Choice |
|------|--------|
| App & routing | Expo SDK 54, Expo Router |
| Language & UI | TypeScript, NativeWind (`className`) |
| Icons | lucide-react-native |
| Motion & gestures | react-native-reanimated, react-native-gesture-handler |
| Lists | `@shopify/flash-list` (where used) |
| Glass | expo-blur (sparingly) |
| Feedback | expo-haptics |
| Images | expo-image |
| Primitives | `@rn-primitives/*`, `components/ui/` |

**In `package.json` but optional / not central to architecture doc:** expo-file-system, expo-av, expo-sqlite, expo-camera, etc. — use when a feature needs them; no global requirement listed here.

---

## 4. Route map & main folders

### `app/` routes (high level)

| Area | Path | Role |
|------|------|------|
| Entry | `index.tsx` | Redirect into tabs |
| Tabs | `(tabs)/_layout.tsx` | Bottom tabs: Chats, Contacts, Settings |
| Chats list | `(tabs)/chats.tsx` | Main inbox, search, selection, archive entry |
| Contacts | `(tabs)/contacts.tsx` | Contact list, active row, FAB, add contact |
| Settings | `(tabs)/settings.tsx` | Profile, appearance, links to sub-settings |
| Notifications settings | `settings/notifications.tsx` | Notification prefs (UI) |
| Chat thread | `chat/[id].tsx` | Messages, input, header, call entry |
| Chat / channel / group info | `chat/details/[id].tsx` | Info screen, members, media, overflow sheet |
| Archived | `archived.tsx` | Archived chats |
| Compose | `compose/new-chat.tsx`, `new-group.tsx`, `new-channel.tsx` | Start conversations |
| Call | `call/[id].tsx` | In-call UI |
| Recents | `recents.tsx` | Call history sections |
| Profile | `profile/[userId].tsx`, `profile/edit.tsx` | User card & edit |

### Context providers (root)

 Wired in `app/_layout.tsx`:

- **`ChatProvider`** — chats, messages map, archive, selection, mute/delete flows, toast, current user profile slice used across app  
- **`ContactsProvider`** — contact list state (seed from `constants/mockContacts`)  
- **`CallProvider`** — active call UI state  

### `constants/` (seed data & types)

| File | Purpose |
|------|---------|
| `mockChats.ts` | `Chat`, members, channels/groups, `mockChats` seed |
| `mockMessages.ts` | `Message` type, `MOCK_MESSAGES` per chat id |
| `mockContacts.ts` | Contacts seed |
| `mockProfiles.ts` | User profiles (incl. “current user” card) |
| `mockCalls.ts` | Call records for recents |

### `components/chat/` (non-exhaustive)

Includes: `ChatListItem`, `ChatHeader`, `ChatInput`, `MessageBubble`, `MuteSheet`, `ChatMoreMenu`, `SearchOverlay`, `MediaViewer`, `ReactionTray`, `ChatInfoOverflowSheet`, group member sheets, voice/camera pieces, etc.

### `lib/` (helpers)

Examples: `theme.ts`, `utils.ts`, `tabScreenLayout.ts`, `chatListPreview.ts`, `messages/replyPreview.ts`, `channel.ts`.

### `lib/mocks/` (pretend backend — **use this instead of raw seeds in UI**)

| File | Role |
|------|------|
| `chatStore.ts` | Bootstrap chats + message map, `getSeedMessagesForChat`, `findSeedChatById`, async loaders; re-exports `Chat`, `Message`, `MessageReplyPreview`, `CURRENT_USER_ID`. |
| `contactsStore.ts` | Bootstrap contacts list; re-exports `Contact`. |
| `profileStore.ts` | Re-exports profile accessors used by profile routes. |
| `callsStore.ts` | Re-exports call recents helpers from `constants/mockCalls`. |

**Still OK:** `import type { … }` from `constants/mockChats.ts` for types that are not re-exported yet (e.g. `GroupMember`). Prefer `lib/mocks/chatStore` for `Chat` / message types when possible.

---

## 5. Architecture rules

1. **`app/*` screens** — Composition and navigation wiring; avoid huge business logic blobs in a single screen file when a component or hook is clearer.  
2. **`components/ui/`** — Reusable primitives (button, text, avatar, dialog patterns).  
3. **`components/chat/`** — Chat-specific UI blocks.  
4. **`context/*`** — Cross-screen state for chats, contacts, calls.  
5. **Data**  
   - **Seeds** stay in `constants/*`. **`lib/mocks/*`** is the door for reads/writes of pretend data (bootstrap + helpers).  
   - **`ChatContext` / `ContactsContext`** initialize from `bootstrapChats()`, `bootstrapMessagesByChatId()`, `bootstrapContacts()`.  
   - **Avoid** `MOCK_*` / `mockChats` in `app/` and `components/` — use context or `lib/mocks/*`. Type-only imports from `constants/*` for types not re-exported from mocks are fine.  
6. **Styling** — NativeWind + tokens; support dark mode; keep bubbles high-contrast.  
7. **Phase guard** — Do not integrate Clerk, Convex, paid SDKs, or real VoIP backends into production navigation paths until the project explicitly moves to that phase.

---

## 6. `lib/mocks` checklist

**Goal:** One boundary for “pretend backend” so Convex (or any API) plugs in behind the same shapes.

### Done (baseline)

- [x] `lib/mocks/chatStore.ts`, `contactsStore.ts`, `profileStore.ts`, `callsStore.ts`  
- [x] `ChatContext` / `ContactsContext` bootstraps from mock stores  
- [x] No `MOCK_MESSAGES` / `mockChats` in app routes; chat list preview uses live `messagesByChatId` when present  
- [x] `lib/chatListPreview.ts` uses `getSeedMessagesForChat` instead of touching `MOCK_MESSAGES` directly  

### Optional next passes

- [ ] Route **`addMessage` / `setChats`** through named functions in `chatStore.ts` (same behavior, clearer swap for Convex).  
- [ ] Re-export remaining-only types (**`GroupMember`**, etc.) from `lib/mocks` so **zero** `constants` imports in `app/`.  
- [ ] **`ChatContext`**: lazy-init with `await loadInitialChats()` only if you introduce suspense / loading gate (avoid empty first paint).  
- [ ] Grep occasionally: `MOCK_`, `mockChats`, `mockContacts` outside `constants/` + `lib/mocks/`.

---

## 7. Quick reference

| Item | Location |
|------|----------|
| Root layout, providers | `app/_layout.tsx` |
| Tabs | `app/(tabs)/_layout.tsx` |
| Chat list | `app/(tabs)/chats.tsx` |
| Thread | `app/chat/[id].tsx` |
| Info / group / channel | `app/chat/details/[id].tsx` |
| Chat state | `context/ChatContext.tsx` |
| Contacts state | `context/ContactsContext.tsx` |
| Calls | `context/CallContext.tsx`, `app/call/[id].tsx`, `components/call/` |
| Toast type | `components/ui/Toast.tsx` |
| Theme | `lib/theme.ts` |
| Chat types & seeds | `constants/mockChats.ts`, `constants/mockMessages.ts` |
| Mock boundary (UI imports) | `lib/mocks/chatStore.ts`, `contactsStore.ts`, `profileStore.ts`, `callsStore.ts` |

---

## 8. Target sync & policy (preview)

**Status:** Not implemented in code yet — canonical detail also lives in the Cursor plan (`Codebase recommendations` / Final architecture). This section exists so **Convex + SQLite** work does not drift.

### 8.1 Composite cursor comparator (no drift)

Messages are ordered by **`(serverCreatedAt, serverMessageId)`** as a **lexicographic pair** (both from the server after ack). **Never** paginate on `serverCreatedAt` alone.

**Definitions:** `serverCreatedAt` is a comparable scalar (e.g. epoch ms). `serverMessageId` is a stable string (e.g. Convex `_id`) used only as a **tie-breaker** when timestamps collide.

**“Strictly newer” than bound** `(B_ts, B_id)` — used for delta sync “after `latestSyncedCursor`”:

```text
NEWER(A_ts, A_id)  :=  (A_ts > B_ts)  OR  (A_ts === B_ts AND A_id > B_id)
```

**“Strictly older” than bound** `(B_ts, B_id)` — used for “before `oldestLocalCursor`” when loading older history:

```text
OLDER(A_ts, A_id)  :=  (A_ts < B_ts)  OR  (A_ts === B_ts AND A_id < B_id)
```

**Concrete example (same timestamp):**

- Bound `(1700000001000, "msg_040")`
- Row A `(1700000001000, "msg_041")` → **NEWER** (same `ts`, `msg_041` > `msg_040` lexicographically)
- Row B `(1700000001000, "msg_039")` → **OLDER**

**Concrete example (different timestamp):**

- Bound `(1700000000000, "msg_099")`
- Row C `(1700000001000, "msg_001")` → **NEWER** (`ts` greater; id tie-break irrelevant)

**Tuple shorthand (same rule):** write **`(ts₁, id₁) > (ts₂, id₂)`** when **`NEWER(ts₁, id₁)`** with bound **`(ts₂, id₂)`** — i.e. lexicographic “greater than” on the pair, **not** `ts₁ > ts₂` alone.

Implement the same comparison in **Convex** (query bounds) and **SQLite** (local merge / dedupe ordering). Use a **compound index** that matches this sort order.

**`serverMessageId` tie-break (anti-drift):** When `serverCreatedAt` ties, both sides must compare the second half of the pair **identically** or pagination **skips/duplicates** rows.

**Single shared rule (ship once, reuse everywhere):** treat `serverMessageId` as an opaque string and compare with **plain string ascending order** (one documented rule: e.g. JavaScript **UTF-16 code unit** `localeCompare`, or **byte** `strcmp` on UTF-8 — **pick one** and use **identical** ordering in **Convex**, **SQLite** `COLLATE`, and the **app**). Implement **`compareMessageId(a, b) -> -1 | 0 | 1`** once; add tests for two rows with **equal** `serverCreatedAt` and **different** ids. Never mix collations across layers.

### 8.2 Remote config defaults — channel daily ad caps (exact integers)

These are **default** values for **remote config** (tunable without app store release). **Plus must remain strictly below Free** for the same metric.

| Remote config key | Default (integer) | Meaning |
|-------------------|------------------|---------|
| `ads_channel_daily_impressions_cap_free` | **18** | Max **channel-feed** ad impressions per user per **calendar day** (Free). |
| `ads_channel_daily_impressions_cap_plus` | **9** | Same, **Plus** (must be `<` Free default). |

**Related defaults** (already in product plan; keep in same config store):

| Key | Default | Meaning |
|-----|---------|---------|
| `ads_interstitial_min_gap_seconds_free` | **1200** | ~**20 minutes** minimum between interstitials (Free). |
| `ads_interstitial_max_per_day_free` | **3** | Max interstitial **events** per user per day (Free). |
| `ads_interstitial_max_per_day_plus` | **2** | Stricter cap for Plus (optional; set in same config). |

Slot rules (**1 ad / 12** organic posts Free, **1 / 25** Plus) stay as documented in the plan; **daily impression caps** above are an additional **hard ceiling** per day.

### 8.3 Entitlement grace — single UX rule (10 minutes)

**Trigger:** RevenueCat / Convex cannot confirm an **active** entitlement for the user’s tier (network error, billing lapse, webhook delay, etc.).

**Banner copy (keep in sync with allow/block lists below):**

| Phase | Duration | Banner (reference) |
|-------|----------|-------------------|
| **Grace** | **0–10 minutes** after first failed verification in a session | *“We can’t verify your subscription. You can keep reading chats and messaging on Free limits while we retry (up to 10 minutes).”* — persistent slim bar; optional **“syncing billing…”** on upgrade / paywall entry points. |
| **Hard block** | **After 10 minutes** still unverified | *“We couldn’t confirm your subscription. Renew to restore paid features.”* |

**Allow / block — single source (product, Convex, QA):**

**During 0–10 min grace — allowed**

- Read / browse chats (cached and live where already connected).  
- **Send** messages only within **Free** tier limits (size, rate, paid-only surfaces off).  
- Open **subscription / billing / manage** screens (restore, manage plan).  
- Normal navigation that does not require a **paid-only** mutation.  

**During grace — blocked (Convex + UI)** — same **paid** surface rules as hard block (calls, paid uploads, paid-only writes, new IAP); only **Free-tier** sends/reads stay open so behavior matches the grace banner.  

**After 10 min hard block — allowed**

- Read **cached** chats (no new paid-only server reads if product requires; default: read local store).  
- Open **billing / subscription** settings (App Store / Play / restore flows).  
- **Send** only within **Free** tier caps if product allows outbound at all.  
- Receive inbound sync that does not imply claiming paid features server-side.  

**After hard block — blocked**

- Starting **paid** calls.  
- **Paid** uploads (over Free max size / paid-only media pipeline).  
- **Paid-only** actions (posts, features, rooms gated to Plus/Pro).  
- **New** in-app **purchases** until billing is healthy again.  

**Convex:** reject mutations in the **blocked** rows; mirror the same rules in the client so QA sees one spec (**this list**).

**Engineering:** one clock source (e.g. `entitlementDegradedAt` from first failure); reset grace when RevenueCat + Convex agree again.

**Alternate (if product restores “full paid during grace”):** replace the grace **allowed** bullets and **banner** together so copy never promises more than Convex allows — do not split “marketing grace” from “server grace.”

### 8.4 Known limitations (v1)

1. **Multi-device:** **Best-effort** consistency; **strict dedupe** on sends (`clientMessageId`). Full cross-device parity (drafts, receipts, etc.) is **not** a v1 guarantee.  
2. **Calls:** **LiveKit / WebRTC** requires an **EAS dev client** or **store/production** build — **not** full-featured in **Expo Go**.  
3. **Search:** **No** server-side **global message search** in v1 — inbox search stays **local** (SQLite / loaded metadata) per product plan.  

### 8.5 Phase 1 acceptance checklist (sync, dedupe, pagination, retry, force-resync)

Use this for **QA** when the SQLite + Convex sync layer lands.

- [ ] **Cold open thread:** UI renders **last known messages from SQLite** without waiting on network; spinner optional for delta.  
- [ ] **Delta fetch:** Only rows **strictly newer** than `latestSyncedCursor` per **§8.1** comparator; **no duplicates** when many messages share one timestamp.  
- [ ] **Older pagination:** Scrolling up exhausts **local** rows first; **one** server page only when `hasMoreRemoteOlder` and local floor reached; uses **`OLDER`** comparator vs `oldestLocalCursor`.  
- [ ] **Dedupe:** Two taps “send” with same `clientMessageId` → **one** Convex row; retry after timeout returns same server message.  
- [ ] **Pending → committed:** Local pending row **replaced** by server row on ack, order re-anchored to `serverCreatedAt` / `serverMessageId`.  
- [ ] **Retry queue:** Failed send enters backoff + jitter; manual retry works; cap at **failed** with visible state.  
- [ ] **`forceResync` (single chat):** Clears **only** that chat’s local message slice (or marks stale), refetches by **cursor windows**, UI matches server after merge.  
- [ ] **Telemetry hooks present** (queue depth, delta latency, dedupe hits) — can be dev-only at first.  

---

## 9. Plan & backlog

### Done (relative to older drafts of this doc)

- Chat thread with messages, input, header, long-press / reactions / reply patterns (mock).  
- Chat info screen, archived chats, contacts tab, settings tab, compose flows, call/recents surfaces (mock).  
- Rich chat components under `components/chat/`.

### Next (recommended order)

1. **§6 optional passes** — named mutators in `chatStore`, re-export stray types, loading pattern if you go async init.  
2. **Keep `SYSTEM.md` in sync** — new routes/providers: update §4 or §7 in the same PR when practical.  
3. **Product polish (optional)** — Tab bar refinement; horizontal swipe between tabs (watch gesture vs. lists).  
4. **Later phase (explicit product decision)** — `(auth)` UI mock; Convex + Clerk; real media/call backends.

### Rules to keep

- No real backend in screens until the project leaves UI-first phase.  
- Prefer **one data boundary** (`lib/mocks` → later API) over scattered constant imports.  
- Offline-style UX (sending / sent / failed) remains a good product target; implement in mock layer + UI when you touch send pipeline again.
