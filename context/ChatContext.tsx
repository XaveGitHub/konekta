import { type ToastConfig } from "@/components/ui/Toast";
import { formatLastMessagePreview } from "@/lib/chatListPreview";
import type { Chat, Message } from "@/lib/mocks/chatStore";
import {
  bootstrapChats,
  bootstrapMessagesByChatId,
} from "@/lib/mocks/chatStore";
import {
  initialCurrentUserProfile,
  type UserProfile,
} from "@/lib/mocks/profileStore";
import {
  Archive as ArchiveIcon,
  ArchiveRestore,
  Check,
  Trash2,
  X,
} from "lucide-react-native";
import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from "react";

type ChatContextType = {
  currentUserProfile: UserProfile;
  updateCurrentUserProfile: (patch: Partial<UserProfile>) => void;
  chats: Chat[];
  messagesByChatId: Record<string, Message[]>;
  archivedChatIds: Set<string>;
  selectedChats: Set<string>;
  isDeleteDialogOpen: boolean;
  isMuteDialogOpen: boolean;
  toast: (ToastConfig & { id: number }) | null;
  setIsDeleteDialogOpen: (val: boolean) => void;
  setIsMuteDialogOpen: (val: boolean) => void;
  setSelectedChats: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleSelection: (id: string) => void;
  handleClearSelection: () => void;
  showToast: (config: ToastConfig) => void;
  handleMuteConfirmed: (value: string, ids?: string[]) => void;
  handleDelete: (isEverySelectedGroup: boolean, targetIds?: string[]) => void;
  handleArchive: (targetIds?: string[]) => void;
  handleUnarchive: (targetIds?: string[]) => void;
  handleToggleReadStatus: (isEverySelectedRead: boolean, targetIds?: string[]) => void;
  acceptMessageRequest: (chatId: string) => void;
  declineMessageRequest: (chatId: string) => void;
  addGroupMembers: (chatId: string, contacts: any[]) => void;
  removeGroupMember: (chatId: string, memberId: string) => void;
  updateMemberRole: (chatId: string, memberId: string, role: "admin" | "member") => void;
  setArchivedChatIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  addMessage: (chatId: string, message: Message) => void;
  setMessagesByChatId: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  updateMessageStatus: (chatId: string, messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read') => void;
  setToast: React.Dispatch<
    React.SetStateAction<(ToastConfig & { id: number }) | null>
  >;
  adImpressionsToday: number;
  incrementAdImpression: () => void;
  adDismissedUntil: number;
  dismissAd: (durationMs: number) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(
    initialCurrentUserProfile,
  );
  const [chats, setChats] = useState(bootstrapChats);
  const [messagesByChatId, setMessagesByChatId] = useState<
    Record<string, Message[]>
  >(bootstrapMessagesByChatId);

  const updateCurrentUserProfile = useCallback((patch: Partial<UserProfile>) => {
    setCurrentUserProfile((prev) => ({ ...prev, ...patch }));
  }, []);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isMuteDialogOpen, setIsMuteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toast, setToast] = useState<(ToastConfig & { id: number }) | null>(
    null,
  );
  const [archivedChatIds, setArchivedChatIds] = useState<Set<string>>(
    new Set(),
  );
  const [adImpressionsToday, setAdImpressionsToday] = useState(0);
  const [adDismissedUntil, setAdDismissedUntil] = useState(0);

  const pendingDeleteRef = useRef<string[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((config: ToastConfig) => {
    toastIdRef.current += 1;
    setToast({ ...config, id: toastIdRef.current });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedChats(new Set());
    setIsMuteDialogOpen(false);
  }, []);

  const handleMuteConfirmed = useCallback((value: string, targetIds?: string[]) => {
    const ids = targetIds || Array.from(selectedChats);
    if (ids.length === 0) return;
    
    // Create a set for fast lookup
    const idSet = new Set(ids);

    let mutedUntil: number | undefined;
    if (value === '1h') mutedUntil = Date.now() + 3600000;
    else if (value === '8h') mutedUntil = Date.now() + 8 * 3600000;
    else if (value === '2d') mutedUntil = Date.now() + 2 * 24 * 3600000;
    else if (value === 'forever') mutedUntil = 2147483647000;

    setChats((prev) =>
      prev.map((chat) =>
        idSet.has(chat.id)
          ? {
              ...chat,
              isMuted: value !== "unmute",
              mutedUntil: value === "unmute" ? undefined : mutedUntil,
            }
          : chat,
      ),
    );

    if (!targetIds) {
      handleClearSelection();
    }
    setIsMuteDialogOpen(false);
  }, [selectedChats, handleClearSelection]);

  const handleDelete = useCallback(
    (isEverySelectedGroup: boolean, targetIds?: string[]) => {
      const ids = targetIds || Array.from(selectedChats);
      if (ids.length === 0) return;

      pendingDeleteRef.current = ids;
      const backupChats = [...chats];
      const backupArchivedIds = new Set(archivedChatIds);

      // Optimistically remove from main list
      setChats((prev) => prev.filter((c) => !ids.includes(c.id)));
      setArchivedChatIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      handleClearSelection();
      setIsDeleteDialogOpen(false);

      showToast({
        message: (() => {
          const targets = backupChats.filter((c) => ids.includes(c.id));
          const allLeave =
            targets.length > 0 &&
            targets.length === ids.length &&
            targets.every((c) => c.isGroup || c.isChannel);
          if (allLeave) {
            if (ids.length === 1) {
              const t = targets[0];
              if (t?.isChannel) return "You left the channel";
              return "You left the group";
            }
            const allCh = targets.every((c) => c.isChannel);
            const allG = targets.every((c) => c.isGroup);
            if (allCh) return `You left ${ids.length} channels`;
            if (allG) return `You left ${ids.length} groups`;
            return `You left ${ids.length} conversations`;
          }
          return isEverySelectedGroup
            ? ids.length === 1
              ? "You left the group"
              : `You left ${ids.length} groups`
            : ids.length === 1
              ? "Chat deleted"
              : `${ids.length} chats deleted`;
        })(),
        icon: Trash2,
        countdown: 5,
        onUndo: () => {
          setChats(backupChats);
          setArchivedChatIds(backupArchivedIds);
          pendingDeleteRef.current = [];
        },
        onDismiss: () => {
          pendingDeleteRef.current = [];
        },
      });
    },
    [selectedChats, handleClearSelection, showToast, chats, archivedChatIds],
  );

  const handleArchive = useCallback((targetIds?: string[]) => {
    const ids = targetIds || Array.from(selectedChats);
    if (ids.length === 0) return;

    // IMMEDIATE: Add to archivedChatIds
    setArchivedChatIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

    handleClearSelection();

    showToast({
      message:
        ids.length === 1 ? "Chat archived" : `${ids.length} chats archived`,
      icon: ArchiveIcon,
      countdown: 5,
      onUndo: () => {
        setArchivedChatIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      },
    });
  }, [selectedChats, handleClearSelection, showToast]);

  const handleUnarchive = useCallback(
    (targetIds?: string[]) => {
      const ids = targetIds ?? Array.from(selectedChats);
      if (ids.length === 0) return;

      setArchivedChatIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });

      if (!targetIds) {
        handleClearSelection();
      }

      showToast({
        message:
          ids.length === 1 ? "Chat unarchived" : `${ids.length} chats unarchived`,
        icon: ArchiveRestore,
      });
    },
    [selectedChats, handleClearSelection, showToast],
  );

  const handleToggleReadStatus = useCallback(
    (isEverySelectedRead: boolean, targetIds?: string[]) => {
      const ids = targetIds || Array.from(selectedChats);
      const idSet = new Set(ids);
      setChats((prev) =>
        prev.map((chat) =>
          idSet.has(chat.id)
            ? { ...chat, unreadCount: isEverySelectedRead ? 1 : 0 }
            : chat,
        ),
      );
      if (!targetIds) {
        handleClearSelection();
      }
    },
    [selectedChats, handleClearSelection],
  );

  const acceptMessageRequest = useCallback(
    (chatId: string) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, isMessageRequest: false, unreadCount: 0 }
            : c,
        ),
      );
      showToast({
        message: "Request accepted — chat is now in your main list",
        icon: Check,
      });
    },
    [showToast],
  );

  const declineMessageRequest = useCallback(
    (chatId: string) => {
      const backupArchived = new Set(archivedChatIds);
      const backupChats = [...chats];
      setArchivedChatIds((prev) => {
        const next = new Set(prev);
        next.add(chatId);
        return next;
      });
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, isMessageRequest: false, unreadCount: 0 }
            : c,
        ),
      );
      showToast({
        message: "Request declined",
        icon: X,
        countdown: 5,
        onUndo: () => {
          setArchivedChatIds(backupArchived);
          setChats(backupChats);
        },
      });
    },
    [archivedChatIds, chats, showToast],
  );

  const updateMessageStatus = useCallback((chatId: string, messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read') => {
    setMessagesByChatId((prev) => {
      const msgs = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: msgs.map(m => m.id === messageId ? { ...m, status } : m)
      };
    });
  }, []);
  
  const addMessage = useCallback((chatId: string, message: Message) => {
    setMessagesByChatId((prev) => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: [...chatMessages, message],
      };
    });

    // Update the last message and timestamp in the chats list (same rules as list preview)
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: formatLastMessagePreview(chat, message),
            lastMessageAt: message.timestamp,
          };
        }
        return chat;
      }),
    );

    // --- Message Delivery Simulation Cascade ---
    if (message.isMe && message.status === 'sending') {
      const targetChat = chats.find(c => c.id === chatId);
      const isGroupOrChannel = targetChat?.isGroup || targetChat?.isChannel;

      // 1. Sent (Server received) -> 400ms
      setTimeout(() => {
        updateMessageStatus(chatId, message.id, 'sent');
        // 2. Delivered (Device received) -> 1.2s total
        setTimeout(() => {
          updateMessageStatus(chatId, message.id, 'delivered');
          // 3. Read (User opened) -> 3.2s total (only 1-on-1 chats)
          if (!isGroupOrChannel) {
             setTimeout(() => {
               updateMessageStatus(chatId, message.id, 'read');
             }, 2000);
          }
        }, 800);
      }, 400);
    }
  }, [chats, updateMessageStatus]);

  const addGroupMembers = useCallback((chatId: string, newContacts: any[]) => {
    if (newContacts.length === 0) return;

    setChats((prev) => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const existingIds = new Set(chat.members?.map(m => m.id) || []);
      const toAdd = newContacts
        .filter(c => !existingIds.has(c.id))
        .map(c => ({ id: c.id, name: c.name, role: "member" as const, avatarUrl: c.avatarUrl }));
      
      if (toAdd.length === 0) return chat;

      return {
        ...chat,
        members: [...(chat.members || []), ...toAdd]
      };
    }));

    // Inject System Message
    const names = newContacts.map(c => c.name || "Unknown").filter(Boolean);
    if (names.length === 0) return;

    let text = "";
    if (names.length === 1) text = `You added ${names[0]}`;
    else if (names.length === 2) text = `You added ${names[0]} and ${names[1]}`;
    else text = `You added ${names[0]} and ${names.length - 1} others`;

    const systemMsg: Message = {
      id: `sys-add-${Date.now()}`,
      chatId,
      senderId: 'system',
      text,
      timestamp: 'Just now',
      date: new Date().toISOString().split('T')[0],
      fullTimestamp: Math.floor(Date.now() / 1000),
      status: 'sent',
      type: 'system',
      isMe: false,
    };
    addMessage(chatId, systemMsg);
    showToast({ message: text, icon: Check });
  }, [addMessage, showToast]);

  const removeGroupMember = useCallback((chatId: string, memberId: string) => {
    let memberName = "";
    setChats((prev) => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const member = chat.members?.find(m => m.id === memberId);
      if (member) memberName = member.name;
      return {
        ...chat,
        members: (chat.members || []).filter(m => m.id !== memberId)
      };
    }));

    // Inject System Message
    const systemMsg: Message = {
      id: `sys-rem-${Date.now()}`,
      chatId,
      senderId: 'system',
      text: `You removed ${memberName || 'a member'}`,
      timestamp: 'Just now',
      date: new Date().toISOString().split('T')[0],
      fullTimestamp: Math.floor(Date.now() / 1000),
      status: 'sent',
      type: 'system',
      isMe: false,
    };
    addMessage(chatId, systemMsg);
    showToast({ message: `Removed ${memberName || 'member'}`, icon: Trash2 });
  }, [addMessage, showToast]);

  const updateMemberRole = useCallback((chatId: string, memberId: string, role: "admin" | "member") => {
    let memberName = "";
    setChats((prev) => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const member = chat.members?.find(m => m.id === memberId);
      if (member) memberName = member.name;
      return {
        ...chat,
        members: (chat.members || []).map(m => m.id === memberId ? { ...m, role } : m)
      };
    }));

    // Inject System Message
    const systemMsg: Message = {
      id: `sys-role-${Date.now()}`,
      chatId,
      senderId: 'system',
      text: role === 'admin' ? `You promoted ${memberName} to Admin` : `You demoted ${memberName}`,
      timestamp: 'Just now',
      date: new Date().toISOString().split('T')[0],
      fullTimestamp: Math.floor(Date.now() / 1000),
      status: 'sent',
      type: 'system',
      isMe: false,
    };
    addMessage(chatId, systemMsg);
    showToast({ message: role === 'admin' ? `Promoted ${memberName}` : `Demoted ${memberName}`, icon: Check });
  }, [addMessage, showToast]);

  const incrementAdImpression = useCallback(() => {
    setAdImpressionsToday((prev) => prev + 1);
  }, []);

  const dismissAd = useCallback((durationMs: number) => {
    setAdDismissedUntil(Date.now() + durationMs);
    showToast({
      message: "ad hidden for 20m · go pro to remove all ads",
      icon: X,
    });
  }, [showToast]);

  const value = {
    currentUserProfile,
    updateCurrentUserProfile,
    chats,
    archivedChatIds,
    selectedChats,
    isDeleteDialogOpen,
    isMuteDialogOpen,
    toast,
    setIsDeleteDialogOpen,
    setIsMuteDialogOpen,
    setSelectedChats,
    toggleSelection,
    handleClearSelection,
    showToast,
    handleMuteConfirmed,
    handleDelete,
    handleArchive,
    handleUnarchive,
    handleToggleReadStatus,
    acceptMessageRequest,
    declineMessageRequest,
    addGroupMembers,
    removeGroupMember,
    updateMemberRole,
    setArchivedChatIds,
    setChats,
    messagesByChatId,
    updateMessageStatus,
    addMessage,
    setMessagesByChatId,
    setToast,
    adImpressionsToday,
    incrementAdImpression,
    adDismissedUntil,
    dismissAd,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
