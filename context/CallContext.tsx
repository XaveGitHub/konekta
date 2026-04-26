import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import type { Chat } from '@/lib/mocks/chatStore';

export type CallParticipant = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export interface ActiveCall {
  id: string;
  kind: 'direct' | 'group';
  /** Group: member count; direct: you + peer (2). */
  participantCount: number;
  participants: CallParticipant[];
  type: 'audio' | 'video'; // Dynamic status
  title: string;
  avatarUrl: string | null;
  // Granular stream states separated exactly like Telegram
  isLocalVideoEnabled: boolean;
  isLocalMuted: boolean;
  isRemoteVideoEnabled: boolean;
  isRemoteMuted: boolean;
  // Call Lifecycle
  status: 'ringing' | 'active';
  connectedAt: Date | null;
}

function callMetaFromChat(chat: Chat): {
  kind: 'direct' | 'group';
  participants: CallParticipant[];
  participantCount: number;
} {
  if (chat.isGroup && chat.members && chat.members.length > 0) {
    return {
      kind: 'group',
      participants: chat.members.map((m) => ({
        id: m.id,
        name: m.name,
        avatarUrl: m.avatarUrl ?? null,
      })),
      participantCount: chat.members.length,
    };
  }
  return { kind: 'direct', participants: [], participantCount: 2 };
}

interface CallContextType {
  activeCall: ActiveCall | null;
  isMinimized: boolean;
  duration: number; // In seconds
  startAudioCall: (chat: Chat) => void;
  startVideoCall: (chat: Chat) => void;
  endCall: () => void;
  minimizeCall: () => void;
  restoreCall: () => void;
  toggleLocalVideo: () => void;
  toggleLocalMute: () => void;
  toggleRemoteVideo: () => void;
  toggleRemoteMute: () => void;
  updateCallType: (type: 'audio' | 'video') => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [duration, setDuration] = useState(0);
  const activeCallRef = useRef<ActiveCall | null>(null);

  // Auto-Answer Mock: Simulates the remote user picking up the phone after 2.5 seconds
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (activeCall?.status === 'ringing') {
      timer = setTimeout(() => {
        updateCallState({ status: 'active', connectedAt: new Date() });
      }, 4500);
    }
    return () => clearTimeout(timer);
  }, [activeCall?.status]);

  // Global Clock: Ticks every 1000ms when the call is successfully active
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeCall?.status === 'active') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  const startAudioCall = (chat: Chat) => {
    const { kind, participants, participantCount } = callMetaFromChat(chat);
    const newCall: ActiveCall = {
      id: chat.id,
      kind,
      participants,
      participantCount,
      title: chat.title,
      avatarUrl: chat.avatarUrl || null,
      type: 'audio',
      isLocalVideoEnabled: false,
      isLocalMuted: false,
      isRemoteVideoEnabled: false,
      isRemoteMuted: false,
      status: 'ringing',
      connectedAt: null,
    };
    activeCallRef.current = newCall;
    setActiveCall(newCall);
    setIsMinimized(false);
  };

  const startVideoCall = (chat: Chat) => {
    const { kind, participants, participantCount } = callMetaFromChat(chat);
    const newCall: ActiveCall = {
      id: chat.id,
      kind,
      participants,
      participantCount,
      title: chat.title,
      avatarUrl: chat.avatarUrl || null,
      type: 'video',
      isLocalVideoEnabled: true,
      isLocalMuted: false,
      isRemoteVideoEnabled: true,
      isRemoteMuted: false,
      status: 'ringing',
      connectedAt: null,
    };
    activeCallRef.current = newCall;
    setActiveCall(newCall);
    setIsMinimized(false);
  };

  const updateCallState = (updates: Partial<ActiveCall>) => {
    if (activeCallRef.current) {
      const updated = { ...activeCallRef.current, ...updates };
      
      // Dynamic mode classification: If ANY video stream is live, it structurally upgrades into a Video Call
      updated.type = (updated.isLocalVideoEnabled || updated.isRemoteVideoEnabled) ? 'video' : 'audio';

      activeCallRef.current = updated;
      setActiveCall(updated);
    }
  };

  const endCall = () => {
    activeCallRef.current = null;
    setActiveCall(null);
    setIsMinimized(false);
  };

  const minimizeCall = React.useCallback(() => {
    if (activeCallRef.current) {
      setIsMinimized(true);
    }
  }, []);

  const restoreCall = React.useCallback(() => {
    if (activeCallRef.current) {
      setIsMinimized(false);
    }
  }, []);

  const toggleLocalVideo = () => updateCallState({ isLocalVideoEnabled: !activeCallRef.current?.isLocalVideoEnabled });
  const toggleLocalMute = () => updateCallState({ isLocalMuted: !activeCallRef.current?.isLocalMuted });
  const toggleRemoteVideo = () => updateCallState({ isRemoteVideoEnabled: !activeCallRef.current?.isRemoteVideoEnabled });
  const toggleRemoteMute = () => updateCallState({ isRemoteMuted: !activeCallRef.current?.isRemoteMuted });

  const updateCallType = (type: 'audio' | 'video') => {
    updateCallState({
      type,
      isLocalVideoEnabled: type === 'video',
      isRemoteVideoEnabled: type === 'video'
    });
  };

  return (
    <CallContext.Provider value={{ 
      activeCall, isMinimized, duration,
      startAudioCall, startVideoCall, endCall, minimizeCall, restoreCall,
      toggleLocalVideo, toggleLocalMute, toggleRemoteVideo, toggleRemoteMute,
      updateCallType
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
