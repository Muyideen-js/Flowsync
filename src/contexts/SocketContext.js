import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = 'https://flowsync-3fd5.onrender.com';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

/**
 * SocketProvider — creates ONE socket.io connection for the entire app.
 * All pages (Accounts, Inbox, TopBar) share this single socket.
 * The socket stays alive as long as the user is logged in.
 */
export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user?.uid) {
            // No user — tear down any existing socket
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        // Don't recreate if already connected for the same user
        if (socketRef.current?.connected) return;
        if (socketRef.current) socketRef.current.disconnect();

        const socket = io(SOCKET_URL, {
            auth: { userId: user.uid },
            transports: ['websocket', 'polling'],  // fallback to polling if websocket fails
            reconnectionAttempts: Infinity,          // always try to reconnect
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

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [user?.uid]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
