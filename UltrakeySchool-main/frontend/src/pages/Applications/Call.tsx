import React, { useState, useEffect, useRef, useCallback } from 'react';
import socketService, { type IncomingCall } from '../../services/socketService';
import toastService from '../../services/toastService';
import userCommunicationService from '../../services/userCommunicationService';

// ─── Inline styles ────────────────────────────────────────────────────────────
const pageStyles: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%',
  minHeight: 'calc(100vh - 120px)', backgroundColor: '#f8fafc', fontFamily: 'inherit',
};

const headerStyles: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  color: '#fff', padding: '1.25rem 1.5rem',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  borderRadius: '0.75rem 0.75rem 0 0', flexShrink: 0,
};

const headerTitleStyles: React.CSSProperties = {
  margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem'
};

const headerSubStyles: React.CSSProperties = {
  margin: 0, fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem'
};

const statusBadgeConnectedStyles: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.3rem 0.75rem', borderRadius: '2rem',
  backgroundColor: 'rgba(16,185,129,0.2)',
  color: '#10b981', fontSize: '0.75rem', fontWeight: 600,
};

const statusBadgeDisconnectedStyles: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.3rem 0.75rem', borderRadius: '2rem',
  backgroundColor: 'rgba(148,163,184,0.2)',
  color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600,
};

const dotConnectedStyles: React.CSSProperties = {
  width: 8, height: 8, borderRadius: '50%',
  backgroundColor: '#10b981',
  animation: 'pulse 2s infinite',
};

const dotDisconnectedStyles: React.CSSProperties = {
  width: 8, height: 8, borderRadius: '50%',
  backgroundColor: '#94a3b8',
  animation: 'none',
};

const bodyStyles: React.CSSProperties = {
  display: 'flex', flex: 1, overflow: 'hidden', borderRadius: '0 0 0.75rem 0.75rem'
};

const sidebarStyles: React.CSSProperties = {
  width: 300, flexShrink: 0, backgroundColor: '#fff',
  borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
  overflow: 'hidden',
};

const sidebarHeaderStyles: React.CSSProperties = {
  padding: '1rem', borderBottom: '1px solid #e2e8f0',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const sidebarTitleStyles: React.CSSProperties = {
  margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#1e293b'
};

const searchBoxStyles: React.CSSProperties = {
  margin: '0.75rem', padding: '0.5rem 0.75rem',
  border: '1px solid #e2e8f0', borderRadius: '0.5rem',
  fontSize: '0.85rem', outline: 'none', width: 'calc(100% - 1.5rem)',
  boxSizing: 'border-box' as const,
};

const userListStyles: React.CSSProperties = {
  flex: 1, overflowY: 'auto' as const, padding: '0 0.5rem 0.5rem'
};

const userCardSelectedStyles: React.CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '0.65rem 0.75rem',
  borderRadius: '0.5rem', marginBottom: '0.25rem', cursor: 'pointer',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  transition: 'all 0.15s',
};

const userCardDefaultStyles: React.CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '0.65rem 0.75rem',
  borderRadius: '0.5rem', marginBottom: '0.25rem', cursor: 'pointer',
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  transition: 'all 0.15s',
};

const userInfoStyles: React.CSSProperties = {
  flex: 1, minWidth: 0, marginLeft: '0.65rem'
};

const userNameStyles: React.CSSProperties = {
  fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis'
};

const userRoleStyles: React.CSSProperties = {
  fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' as const
};

const callBtnsStyles: React.CSSProperties = {
  display: 'flex', gap: '0.35rem', flexShrink: 0
};

const callBtnPrimaryStyles: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', border: 'none',
  backgroundColor: '#10b981', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.85rem', transition: 'transform 0.15s, opacity 0.15s',
};

const callBtnSecondaryStyles: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', border: 'none',
  backgroundColor: '#64748b', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.85rem', transition: 'transform 0.15s, opacity 0.15s',
};

const mainStyles: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc'
};

const idleScreenStyles: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: '2rem',
};

const idleIconStyles: React.CSSProperties = {
  width: 80, height: 80, borderRadius: '50%',
  backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: '2rem', marginBottom: '1rem',
};

const idleTitleStyles: React.CSSProperties = {
  fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.5rem'
};

const idleSubStyles: React.CSSProperties = {
  fontSize: '0.875rem', color: '#64748b', margin: 0, textAlign: 'center' as const
};

const callingScreenStyles: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
};

const callingAvatarStyles: React.CSSProperties = {
  width: 100, height: 100, borderRadius: '50%',
  backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#fff', fontSize: '2.5rem', fontWeight: 700,
  marginBottom: '1.5rem', boxShadow: '0 0 0 0 rgba(59,130,246,0.4)',
  animation: 'ring 1.5s ease-out infinite',
};

const callingNameStyles: React.CSSProperties = {
  color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem'
};

const callingStatusStyles: React.CSSProperties = {
  color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 2rem'
};

const cancelBtnStyles: React.CSSProperties = {
  width: 60, height: 60, borderRadius: '50%', border: 'none',
  backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
};

const activeCallStyles: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', position: 'relative' as const
};

const videoWrapperStyles: React.CSSProperties = {
  flex: 1, position: 'relative' as const, overflow: 'hidden'
};

const remoteVideoStyles: React.CSSProperties = {
  width: '100%', height: '100%', objectFit: 'cover' as const, backgroundColor: '#1e293b'
};

const localVideoStyles: React.CSSProperties = {
  position: 'absolute' as const, bottom: '1rem', right: '1rem',
  width: 160, height: 120, borderRadius: '0.75rem',
  objectFit: 'cover' as const, border: '2px solid rgba(255,255,255,0.3)',
  backgroundColor: '#334155', zIndex: 10,
};

const voiceCallScreenStyles: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
};

const connectedAvatarStyles: React.CSSProperties = {
  width: 100, height: 100, borderRadius: '50%',
  backgroundColor: '#10b981', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#fff', fontSize: '2.5rem', fontWeight: 700,
  marginBottom: '1.5rem',
};

const connectedNameStyles: React.CSSProperties = {
  color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem'
};

const connectedDurationStyles: React.CSSProperties = {
  color: '#10b981', fontSize: '0.9rem', margin: '0 0 2rem'
};

const controlsStyles: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '1rem', padding: '1.25rem',
  backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
};

const ctrlBtnActiveStyles: React.CSSProperties = {
  width: 52, height: 52, borderRadius: '50%', border: 'none',
  backgroundColor: '#ef4444',
  color: '#fff', cursor: 'pointer',
};

const ctrlBtnInactiveStyles: React.CSSProperties = {
  width: 52, height: 52, borderRadius: '50%', border: 'none',
  backgroundColor: 'rgba(255,255,255,0.15)',
  color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.1rem', transition: 'all 0.2s',
};

const endBtnStyles: React.CSSProperties = {
  width: 60, height: 60, borderRadius: '50%', border: 'none',
  backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.4rem', boxShadow: '0 4px 16px rgba(239,68,68,0.5)',
};

const callInfoStyles: React.CSSProperties = {
  position: 'absolute' as const, top: '1rem', left: '1rem',
  backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
  borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#fff',
  fontSize: '0.8rem', zIndex: 10,
};

const incomingOverlayStyles: React.CSSProperties = {
  position: 'fixed' as const, inset: 0, zIndex: 9999,
  backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const incomingCardStyles: React.CSSProperties = {
  backgroundColor: '#1e293b', borderRadius: '1.25rem',
  padding: '2rem', textAlign: 'center' as const, minWidth: 300,
  boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  animation: 'slideUp 0.3s ease',
};

const incomingAvatarStyles: React.CSSProperties = {
  width: 80, height: 80, borderRadius: '50%',
  backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 700,
  margin: '0 auto 1rem', animation: 'ring 1.5s ease-out infinite',
};

const incomingNameStyles: React.CSSProperties = {
  color: '#fff', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem'
};

const incomingTypeStyles: React.CSSProperties = {
  color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1.5rem'
};

const incomingBtnsStyles: React.CSSProperties = {
  display: 'flex', gap: '1.5rem', justifyContent: 'center'
};

const acceptBtnStyles: React.CSSProperties = {
  width: 60, height: 60, borderRadius: '50%', border: 'none',
  backgroundColor: '#10b981', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
};

const rejectBtnStyles: React.CSSProperties = {
  width: 60, height: 60, borderRadius: '50%', border: 'none',
  backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
};

const emptyStateStyles: React.CSSProperties = {
  padding: '2rem', textAlign: 'center' as const, color: '#94a3b8', fontSize: '0.85rem'
};

const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// Keyframe injection
const injectKeyframes = () => {
  if (document.getElementById('call-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'call-keyframes';
  style.textContent = `
    @keyframes ring {
      0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
      70%  { box-shadow: 0 0 0 20px rgba(59,130,246,0); }
      100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  institutionId?: string;
}

type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected';
type CallType = 'video' | 'voice';

const Call: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('video');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [mediaPermission, setMediaPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const currentUserId = useRef<string>('');
  const currentUserName = useRef<string>('');
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingCallRef = useRef<IncomingCall | null>(null);

  // Keep ref in sync with state (needed inside callbacks)
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    injectKeyframes();

    // Get current user and connect socket
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        currentUserId.current = u.id || u._id || '';
        currentUserName.current = u.name || u.email || 'Me';
        
        // Connect socket first
        socketService.connect(currentUserId.current);
      }
    } catch { /* ignore */ }

    // Pre-request media permission so browser doesn't block mid-call
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(s => {
        setMediaPermission('granted');
        s.getTracks().forEach(t => t.stop()); // release immediately
      })
      .catch(() => {
        // Try audio-only
        navigator.mediaDevices?.getUserMedia({ audio: true })
          .then(s => { setMediaPermission('granted'); s.getTracks().forEach(t => t.stop()); })
          .catch(() => setMediaPermission('denied'));
      });

    // Fetch users
    userCommunicationService.getAllUsers()
      .then(list => {
        const filtered = list.filter(u => u.id !== currentUserId.current);
        setAllUsers(filtered);
        setUsers(filtered);
        
        // Check if there's a call initiation from chat
        const initiateCallData = sessionStorage.getItem('initiateCall');
        if (initiateCallData) {
          try {
            const callData = JSON.parse(initiateCallData);
            const targetUser = filtered.find(u => u.id === callData.userId);
            if (targetUser) {
              setSelectedUser(targetUser);
              setCallType(callData.callType as CallType);
              // Auto-start the call
              setTimeout(() => {
                startCall(targetUser, callData.callType as CallType);
              }, 500);
            }
            // Clear the session data
            sessionStorage.removeItem('initiateCall');
          } catch (error) {
            console.error('Error parsing call initiation data:', error);
          }
        }
      })
      .catch(err => console.error('Error fetching users:', err));

    // Auto-connect socket when call page opens
    if (currentUserId.current) {
      socketService.connect(currentUserId.current);
    }

    // Socket call listeners
    socketService.onIncomingCall(handleIncomingCall);
    socketService.onCallAccepted(handleCallAccepted);
    socketService.onCallRejected(handleCallRejected);
    socketService.onCallEnded(handleCallEnded);

    return () => {
      cleanupCall(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync remoteStream → video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callStatus]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const cleanupCall = (notify = true) => {
    if (notify && selectedUser) {
      socketService.endCall({ to: selectedUser.id });
    }
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setCallStatus('idle');
    setSelectedUser(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    
    // Stop ringtone if playing
    try {
      const ringtoneAudio = (window as any).ringtoneAudio;
      if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
        (window as any).ringtoneAudio = null;
      }
    } catch (error) {
      console.log('Error stopping ringtone:', error);
    }
  };

  const initMedia = async (type: CallType): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error('Media error:', err);
      toastService.error('Cannot access camera/microphone. Check browser permissions.');
      return null;
    }
  };

  const createPC = (stream: MediaStream, targetId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    peerConnectionRef.current = pc;

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      const [rs] = e.streams;
      setRemoteStream(rs);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rs;
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.callUser({
          to: targetId,
          from: currentUserId.current,
          fromName: currentUserName.current,
          signal: { type: 'ice-candidate', candidate: e.candidate },
          callType,
          roomId: `ice-${Date.now()}`,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        toastService.info('Call connection lost');
        cleanupCall(false);
      }
    };

    return pc;
  };

  // ── Call actions ──────────────────────────────────────────────────────────
  const startCall = async (user: User, type: CallType) => {
    if (callStatus !== 'idle') return;
    
    // Check socket connection with retry
    let attempts = 0;
    while (!socketService.isConnected() && attempts < 3) {
      toastService.error(`Connecting to server... (${attempts + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (!socketService.isConnected()) {
      toastService.error('Failed to connect to server. Please refresh the page.');
      return;
    }
    
    setSelectedUser(user);
    setCallType(type);

    const stream = await initMedia(type);
    if (!stream) return;

    const pc = createPC(stream, user.id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    setCallStatus('calling');
    toastService.info(`Calling ${user.name}…`);

    socketService.callUser({
      to: user.id,
      from: currentUserId.current,
      fromName: currentUserName.current,
      signal: offer,
      callType: type,
      roomId: `call-${Date.now()}`,
    });
  };

  const acceptIncomingCall = async () => {
    const call = incomingCallRef.current;
    if (!call) return;

    const type = (call.callType as CallType) || 'video';
    const stream = await initMedia(type);
    if (!stream) return;

    const pc = createPC(stream, call.from);

    // Only set remote description if it's a valid SDP type (offer or answer)
    if (call.signal.type === 'offer' || call.signal.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: call.signal.type as RTCSdpType,
        sdp: call.signal.sdp,
      }));
    } else {
      console.warn('Invalid signal type for RTCSessionDescription:', call.signal.type);
      return;
    }
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    setCallType(type);
    setCallStatus('connected');
    setIncomingCall(null);

    socketService.acceptCall({ to: call.from, signal: answer });
  };

  const rejectIncomingCall = () => {
    const call = incomingCallRef.current;
    if (call) socketService.rejectCall({ to: call.from });
    setIncomingCall(null);
  };

  const endCall = () => cleanupCall(true);

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(v => !v);
  };

  // ── Socket handlers ───────────────────────────────────────────────────────
  const handleIncomingCall = useCallback((call: IncomingCall) => {
    console.log('📞 Incoming call:', call);
    setIncomingCall(call);
    
    // Enhanced toast notification
    const callIcon = call.callType === 'video' ? '📹' : '📞';
    toastService.info(`${callIcon} ${call.fromName} is calling... (${call.callType})`);
    
    // Request notification permission if not granted
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showCallNotification(call);
          }
        });
      } else if (Notification.permission === 'granted') {
        showCallNotification(call);
      }
    }
    
    // Play ringtone sound (if available)
    try {
      const audio = new Audio('/data/audio/ringtone.mp3');
      audio.loop = true;
      audio.play().catch(() => {
        // Fallback to system beep if audio file not found
        console.log('Ringtone audio not found, using system notification');
      });
      // Store audio reference to stop it later
      (window as any).ringtoneAudio = audio;
    } catch (error) {
      console.log('Could not play ringtone:', error);
    }
  }, []);

  // Helper function to show browser notification
  const showCallNotification = (call: IncomingCall) => {
    const notificationOptions: NotificationOptions = {
      body: `${call.fromName} is calling you (${call.callType})`,
      icon: '/favicon.ico',
      tag: `incoming-call-${call.from}`,
      requireInteraction: true
    };

    const notification = new Notification(`Incoming ${call.callType} Call`, notificationOptions);

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Focus on the call when notification is clicked
      if (incomingCall) {
        // User can manually accept/reject the call
      }
    };

    // Auto-close notification after 30 seconds
    setTimeout(() => {
      notification.close();
    }, 30000);
  };

  const handleCallAccepted = useCallback(async (data: { signal: any; from: string }) => {
    if (!peerConnectionRef.current) return;
    try {
      const sig = data.signal;
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription({ type: (sig?.type || 'answer') as RTCSdpType, sdp: sig?.sdp || sig })
      );
      setCallStatus('connected');
    } catch (e) {
      console.error('setRemoteDescription error:', e);
    }
  }, []);

  const handleCallRejected = useCallback(() => {
    toastService.error('Call was declined');
    cleanupCall(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCallEnded = useCallback(() => {
    toastService.info('Call ended');
    cleanupCall(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  const isConnected = socketService.isConnected();

  return (
    <div style={pageStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div>
          <h2 style={headerTitleStyles}>📹 Video &amp; Voice Calls</h2>
          <p style={headerSubStyles}>
            {mediaPermission === 'denied'
              ? '⚠️ Camera/mic permission denied — voice only'
              : 'Connect with users in real time'}
          </p>
        </div>
        <div style={isConnected ? statusBadgeConnectedStyles : statusBadgeDisconnectedStyles}>
          <span style={isConnected ? dotConnectedStyles : dotDisconnectedStyles} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Body */}
      <div style={bodyStyles}>
        {/* ── Left: user list ── */}
        <aside style={sidebarStyles}>
          <div style={sidebarHeaderStyles}>
            <h3 style={sidebarTitleStyles}>Users ({users.length})</h3>
          </div>
          <input
            style={searchBoxStyles}
            placeholder="Search users…"
            value={searchQuery}
            onChange={(e) => {
              const q = e.target.value;
              setSearchQuery(q);
              if (!q.trim()) {
                setUsers(allUsers);
              } else {
                const lower = q.toLowerCase();
                setUsers(allUsers.filter(u =>
                  u.name.toLowerCase().includes(lower) ||
                  u.email.toLowerCase().includes(lower) ||
                  u.role.toLowerCase().includes(lower)
                ));
              }
            }}
          />
          <div style={userListStyles}>
            {users.length === 0 ? (
              <p style={emptyStateStyles}>
                {allUsers.length === 0 ? 'Loading users…' : 'No users match your search'}
              </p>
            ) : (
              users.map((user) => {
                const color = getColor(user.name);
                const initials = getInitials(user.name);
                const isSelected = selectedUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    style={isSelected ? userCardSelectedStyles : userCardDefaultStyles}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                    }}>
                      {initials}
                    </div>
                    <div style={userInfoStyles}>
                      <div style={userNameStyles}>{user.name}</div>
                      <div style={userRoleStyles}>{user.role}</div>
                    </div>
                    <div style={callBtnsStyles}>
                      <button
                        style={callBtnPrimaryStyles}
                        title="Video call"
                        disabled={callStatus !== 'idle'}
                        onClick={(e) => { e.stopPropagation(); startCall(user, 'video'); }}
                      >
                        📹
                      </button>
                      <button
                        style={callBtnSecondaryStyles}
                        title="Voice call"
                        disabled={callStatus !== 'idle'}
                        onClick={(e) => { e.stopPropagation(); startCall(user, 'voice'); }}
                      >
                        📞
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right: call area ── */}
        <main style={mainStyles}>

          {/* IDLE — show selected user info or prompt */}
          {callStatus === 'idle' && (
            <div style={idleScreenStyles}>
              {selectedUser ? (
                <>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: getColor(selectedUser.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '2rem', marginBottom: '1rem',
                  }}>
                    {getInitials(selectedUser.name)}
                  </div>
                  <h3 style={idleTitleStyles}>{selectedUser.name}</h3>
                  <p style={{ ...idleSubStyles, marginBottom: '1.5rem' }}>{selectedUser.role} · {selectedUser.email}</p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      style={{ ...callBtnPrimaryStyles, width: 56, height: 56, fontSize: '1.4rem' }}
                      onClick={() => startCall(selectedUser, 'video')}
                      title="Video call"
                    >📹</button>
                    <button
                      style={{ ...callBtnSecondaryStyles, width: 56, height: 56, fontSize: '1.4rem' }}
                      onClick={() => startCall(selectedUser, 'voice')}
                      title="Voice call"
                    >📞</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={idleIconStyles}>📹</div>
                  <h3 style={idleTitleStyles}>No active call</h3>
                  <p style={idleSubStyles}>Select a user from the list to start a video or voice call.</p>
                </>
              )}
            </div>
          )}

          {/* CALLING — outgoing, waiting for answer */}
          {callStatus === 'calling' && selectedUser && (
            <div style={callingScreenStyles}>
              <div style={{ ...callingAvatarStyles, backgroundColor: getColor(selectedUser.name) }}>
                {getInitials(selectedUser.name)}
              </div>
              <p style={callingNameStyles}>{selectedUser.name}</p>
              <p style={callingStatusStyles}>
                {callType === 'video' ? '📹' : '📞'} Calling…
              </p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 2rem' }}>
                Waiting for {selectedUser.name} to answer
              </p>
              <button style={cancelBtnStyles} onClick={endCall} title="Cancel call">✕</button>
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.75rem' }}>Cancel</p>
            </div>
          )}

          {/* CONNECTED — video call */}
          {callStatus === 'connected' && callType === 'video' && (
            <div style={activeCallStyles}>
              <div style={callInfoStyles}>
                <span style={{ fontWeight: 600 }}>
                  {selectedUser?.name ?? incomingCall?.fromName ?? 'Unknown'}
                </span>
                <span style={{ marginLeft: '0.75rem', color: '#10b981' }}>
                  {formatDuration(callDuration)}
                </span>
              </div>
              <div style={videoWrapperStyles}>
                <video ref={remoteVideoRef} autoPlay playsInline style={remoteVideoStyles} />
                <video ref={localVideoRef} autoPlay playsInline muted style={localVideoStyles} />
              </div>
              <div style={controlsStyles}>
                <div style={{ textAlign: 'center' as const }}>
                  <button
                    style={{ ...ctrlBtnInactiveStyles, ...(isMuted ? ctrlBtnActiveStyles : {}) }}
                    onClick={toggleMute}
                  >
                    {isMuted ? '🔇' : '🎙️'}
                  </button>
                  <p style={{ color: '#94a3b8', fontSize: '0.65rem', margin: '0.3rem 0 0' }}>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </p>
                </div>
                <div style={{ textAlign: 'center' as const }}>
                  <button
                    style={{ ...ctrlBtnInactiveStyles, ...(isVideoOff ? ctrlBtnActiveStyles : {}) }}
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? '📵' : '📹'}
                  </button>
                  <p style={{ color: '#94a3b8', fontSize: '0.65rem', margin: '0.3rem 0 0' }}>
                    {isVideoOff ? 'Start Video' : 'Stop Video'}
                  </p>
                </div>
                <div style={{ textAlign: 'center' as const }}>
                  <button style={endBtnStyles} onClick={endCall}>📵</button>
                  <p style={{ color: '#ef4444', fontSize: '0.65rem', margin: '0.3rem 0 0' }}>End Call</p>
                </div>
              </div>
            </div>
          )}

          {/* CONNECTED — voice call */}
          {callStatus === 'connected' && callType === 'voice' && (
            <div style={voiceCallScreenStyles}>
              <div style={{
                ...connectedAvatarStyles,
                backgroundColor: selectedUser ? getColor(selectedUser.name) : '#10b981',
              }}>
                {selectedUser ? getInitials(selectedUser.name) : '?'}
              </div>
              <p style={connectedNameStyles}>{selectedUser?.name ?? 'Unknown'}</p>
              <p style={connectedDurationStyles}>{formatDuration(callDuration)}</p>
              {/* Hidden audio for remote stream */}
              <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
              <div style={controlsStyles}>
                <div style={{ textAlign: 'center' as const }}>
                  <button
                    style={{ ...ctrlBtnInactiveStyles, ...(isMuted ? ctrlBtnActiveStyles : {}) }}
                    onClick={toggleMute}
                  >
                    {isMuted ? '🔇' : '🎙️'}
                  </button>
                  <p style={{ color: '#94a3b8', fontSize: '0.65rem', margin: '0.3rem 0 0' }}>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </p>
                </div>
                <div style={{ textAlign: 'center' as const }}>
                  <button style={endBtnStyles} onClick={endCall}>📵</button>
                  <p style={{ color: '#ef4444', fontSize: '0.65rem', margin: '0.3rem 0 0' }}>End Call</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Incoming call overlay — full screen, shows caller info ── */}
      {incomingCall && (
        <div style={incomingOverlayStyles}>
          <div style={incomingCardStyles}>
            {/* Caller avatar */}
            <div style={{
              ...incomingAvatarStyles,
              backgroundColor: getColor(incomingCall.fromName),
            }}>
              {getInitials(incomingCall.fromName)}
            </div>
            <p style={incomingNameStyles}>{incomingCall.fromName}</p>
            <p style={incomingTypeStyles}>
              {incomingCall.callType === 'video' ? '📹 Video call' : '📞 Voice call'}
            </p>
            {/* Who is calling whom */}
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 1.5rem' }}>
              is calling you
            </p>
            <div style={incomingBtnsStyles}>
              <div style={{ textAlign: 'center' as const }}>
                <button style={rejectBtnStyles} onClick={rejectIncomingCall}>✕</button>
                <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.4rem' }}>Decline</p>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <button style={acceptBtnStyles} onClick={acceptIncomingCall}>✔</button>
                <p style={{ color: '#10b981', fontSize: '0.7rem', marginTop: '0.4rem' }}>Accept</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Call;
