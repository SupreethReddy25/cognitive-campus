import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const useSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastXPUpdate, setLastXPUpdate] = useState(null);
  const [lastLeaderboardSignal, setLastLeaderboardSignal] = useState(0);
  const [skillUnlockToast, setSkillUnlockToast] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const socket = io('/', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:user', { userId: user._id });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('xp:update', (data) => {
      setLastXPUpdate(data);
    });

    socket.on('leaderboard:refresh', () => {
      setLastLeaderboardSignal(Date.now());
    });

    socket.on('skill:unlocked', (data) => {
      setSkillUnlockToast(data);
      // Auto-clear after 4 seconds
      setTimeout(() => setSkillUnlockToast(null), 4000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const dismissToast = useCallback(() => {
    setSkillUnlockToast(null);
  }, []);

  return {
    isConnected,
    lastXPUpdate,
    lastLeaderboardSignal,
    skillUnlockToast,
    dismissToast
  };
};

export default useSocket;
