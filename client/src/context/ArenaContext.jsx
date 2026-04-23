/**
 * ArenaContext — manages the /arena Socket.io namespace connection
 * and all multiplayer room state for the Arena module.
 *
 * Features: socket connection, room state, Yjs manual bridge,
 * rejoin after refresh, language sync, grace period awareness.
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import * as Y from 'yjs';

const ArenaContext = createContext(null);

export const useArena = () => {
  const ctx = useContext(ArenaContext);
  if (!ctx) throw new Error('useArena must be used within ArenaProvider');
  return ctx;
};

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;

export function ArenaProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const ydocRef = useRef(null);

  // ─── Connection state ───
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // ─── Room state ───
  const [room, setRoom] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [mode, setMode] = useState(null);
  const [matchStatus, setMatchStatus] = useState('idle');
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [joiningInProgress, setJoiningInProgress] = useState(false);

  // ─── Language sync ───
  const [partnerLanguage, setPartnerLanguage] = useState('javascript');

  // ─── Partner offline warning ───
  const [partnerOffline, setPartnerOffline] = useState(null); // { name, graceSeconds }

  // ─── Live sync state ───
  const [remoteCode, setRemoteCode] = useState('');
  const [remoteCursor, setRemoteCursor] = useState(null);
  const [progressMap, setProgressMap] = useState({});

  // ─── Connect to /arena namespace on mount ───
  useEffect(() => {
    if (!user) return;

    const socket = io(`${BACKEND_URL}/arena`, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[ArenaContext] Connected:', socket.id);
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('[ArenaContext] Disconnected');
      setConnected(false);
    });

    // ─── Room lifecycle events ───
    socket.on('arena:room_created', ({ code, room }) => {
      console.log('[ArenaContext] Room created:', code);
      setRoomCode(code);
      setRoom(room);
      setMode(room.mode);
      setPlayers(room.players);
      setMatchStatus('waiting');
      setIsHost(true);
      setHasJoinedRoom(true);
    });

    socket.on('arena:join_success', ({ code, room }) => {
      console.log('[ArenaContext] ✅ JOIN SUCCESS:', code);
      setRoomCode(code);
      setRoom(room);
      setMode(room.mode);
      setPlayers(room.players);
      setMatchStatus('waiting');
      setIsHost(false);
      setHasJoinedRoom(true);
      setJoiningInProgress(false);
      setError(null);
    });

    socket.on('arena:rejoin_success', ({ code, room }) => {
      console.log('[ArenaContext] ✅ REJOIN SUCCESS:', code);
      setRoomCode(code);
      setRoom(room);
      setMode(room.mode);
      setPlayers(room.players);
      setMatchStatus(room.status || 'active');
      setHasJoinedRoom(true);
      setPartnerOffline(null);
    });

    socket.on('arena:player_joined', ({ room }) => {
      setRoom(room);
      setPlayers(room.players);
    });

    socket.on('arena:player_left', ({ room }) => {
      setRoom(room);
      setPlayers(room.players);
    });

    socket.on('arena:match_started', ({ roomId }) => {
      console.log('[ArenaContext] Match started:', roomId);
      setMatchStatus('active');
      setStartedAt(new Date());
    });

    socket.on('arena:match_finished', ({ room, winner }) => {
      setRoom(room);
      setPlayers(room?.players || []);
      setMatchStatus('finished');
      setWinner(winner);
    });

    // ─── Grace period events ───
    socket.on('arena:player_offline', ({ userId, name, graceSeconds }) => {
      console.log(`[ArenaContext] ⚠️ ${name} went offline. ${graceSeconds}s grace period.`);
      setPartnerOffline({ name, graceSeconds });
    });

    socket.on('arena:player_reconnected', ({ room, userId, name }) => {
      console.log(`[ArenaContext] ✅ ${name} reconnected!`);
      setPartnerOffline(null);
      setRoom(room);
      setPlayers(room.players);
    });

    // ─── Language sync ───
    socket.on('arena:language_update', ({ language }) => {
      setPartnerLanguage(language);
    });

    // ─── Code sync (fallback for non-Yjs) ───
    socket.on('arena:code_update', ({ code }) => {
      setRemoteCode(code);
    });

    // ─── Cursor sync ───
    socket.on('arena:cursor_update', ({ userId, name, position, selection }) => {
      setRemoteCursor({ userId, name, position, selection });
    });

    // ─── Progress events ───
    socket.on('arena:progress_update', ({ userId, name, progress, total }) => {
      setProgressMap(prev => ({ ...prev, [userId]: { name, progress, total } }));
    });

    socket.on('arena:submission_update', ({ userId, name, passed, total, allPassed }) => {
      setProgressMap(prev => ({ ...prev, [userId]: { name, progress: passed, total, finished: true, allPassed } }));
    });

    // ─── Error ───
    socket.on('arena:error', ({ message }) => {
      console.log('[ArenaContext] ❌ Error:', message);
      setError(message);
      setJoiningInProgress(false);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // ─── Yjs Document: manual socket bridge ───
  const initYDoc = useCallback(() => {
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // SENDER: Local Yjs updates → Socket
    ydoc.on('update', (update, origin) => {
      if (origin === 'remote') return;
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit('arena:sync_update', { update: Array.from(update) });
    });

    // RECEIVER: Socket → Apply remote Yjs updates
    const socket = socketRef.current;
    if (socket) {
      socket.off('arena:sync_update');
      socket.on('arena:sync_update', ({ update }) => {
        if (ydocRef.current && update) {
          try {
            Y.applyUpdate(ydocRef.current, new Uint8Array(update), 'remote');
          } catch (e) {
            console.warn('[ArenaContext] Failed to apply Yjs update:', e);
          }
        }
      });
    }

    return ydoc;
  }, []);

  // ─── Actions ───
  const createRoom = useCallback((selectedMode, problemId) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('arena:create', {
      userId: user._id, name: user.name, mode: selectedMode, problemId
    });
  }, [user]);

  const joinRoom = useCallback((code) => {
    if (!socketRef.current || !user) return;
    setJoiningInProgress(true);
    setError(null);
    socketRef.current.emit('arena:join', {
      userId: user._id, name: user.name, code
    });
  }, [user]);

  const rejoinRoom = useCallback((roomId) => {
    if (!socketRef.current || !user) return;
    console.log('[ArenaContext] Attempting rejoin for room:', roomId);
    socketRef.current.emit('arena:rejoin', {
      userId: user._id, name: user.name, roomId
    });
  }, [user]);

  const emitStartMatch = useCallback((roomId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('arena:start_match', { roomId });
  }, []);

  const emitLanguageChange = useCallback((language) => {
    if (!socketRef.current || !roomCode) return;
    socketRef.current.emit('arena:language_change', { roomId: roomCode, language });
  }, [roomCode]);

  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !roomCode) return;
    socketRef.current.emit('arena:leave', { roomId: roomCode });
    setRoom(null);
    setRoomCode(null);
    setMode(null);
    setMatchStatus('idle');
    setPlayers([]);
    setWinner(null);
    setProgressMap({});
    setRemoteCode('');
    setRemoteCursor(null);
    setIsHost(false);
    setHasJoinedRoom(false);
    setJoiningInProgress(false);
    setPartnerOffline(null);
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
  }, [roomCode]);

  const syncCode = useCallback((code) => {
    if (!socketRef.current || !roomCode) return;
    socketRef.current.emit('arena:code_sync', { roomId: roomCode, code });
  }, [roomCode]);

  const syncCursor = useCallback((position, selection) => {
    if (!socketRef.current || !roomCode) return;
    socketRef.current.emit('arena:cursor', { roomId: roomCode, position, selection });
  }, [roomCode]);

  const reportTestPassed = useCallback((testIndex, total) => {
    if (!socketRef.current || !roomCode) return;
    socketRef.current.emit('arena:test_passed', { roomId: roomCode, testIndex, total });
  }, [roomCode]);

  const reportSubmission = useCallback((passed, total, allPassed) => {
    if (!socketRef.current || !roomCode) return;
    socketRef.current.emit('arena:submitted', { roomId: roomCode, passed, total, allPassed });
  }, [roomCode]);

  const value = {
    connected, error, room, roomCode, mode, matchStatus, players, winner, startedAt,
    remoteCode, remoteCursor, progressMap, isHost, hasJoinedRoom, joiningInProgress,
    partnerLanguage, partnerOffline,
    createRoom, joinRoom, rejoinRoom, emitStartMatch, emitLanguageChange, leaveRoom,
    syncCode, syncCursor, reportTestPassed, reportSubmission,
    initYDoc,
    socketRef, ydocRef
  };

  return <ArenaContext.Provider value={value}>
    {children}
  </ArenaContext.Provider>;
}
