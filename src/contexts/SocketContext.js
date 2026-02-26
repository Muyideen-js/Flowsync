import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = 'https://flowsync-3fd5.onrender.com';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

/**
 * SocketProvider — creates ONE socket.io connection for the entire app.
 * All pages (Accounts, Inbox, TopBar) share this single socket.
 * Provides connectionStates from backend so all pages have consistent state.
 */
export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    // Unified connection states from backend — null = loading, object = loaded
    const [connectionStates, setConnectionStates] = useState(null);

    const requestStateSync = useCallback(() => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('get_connection_states');
        }
    }, []);

    useEffect(() => {
        if (!user?.uid) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
                setConnectionStates(null);
            }
            return;
        }

        // Don't recreate if already connected for the same user
        if (socketRef.current?.connected) return;
        if (socketRef.current) socketRef.current.disconnect();

        // Get Firebase ID token and connect with it
        let cancelled = false;
        user.getIdToken().then((token) => {
            if (cancelled) return;

            const socket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnectionAttempts: Infinity,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                timeout: 15000,
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log(`[Socket] Connected: ${socket.id} (user: ${user.uid.substring(0, 8)})`);
                setConnected(true);
            });

            socket.on('disconnect', (reason) => {
                console.log(`[Socket] Disconnected: ${reason}`);
                setConnected(false);
            });

            socket.on('connect_error', (err) => {
                console.warn(`[Socket] Connection error: ${err.message}`);
                setConnected(false);
            });

            // Backend always emits FULL state objects — replace entirely
            socket.on('connection_states', (states) => {
                console.log('[Socket] Connection states received:', states);
                setConnectionStates(states);
            });
        });

        return () => {
            cancelled = true;
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setConnected(false);
            setConnectionStates(null);
        };
    }, [user?.uid]);

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            connected,
            connectionStates,
            requestStateSync,
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
