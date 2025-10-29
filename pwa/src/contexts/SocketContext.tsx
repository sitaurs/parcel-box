import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../lib/socket';

interface SocketContextType {
  connected: boolean;
  lastEvent: any;
}

const SocketContext = createContext<SocketContextType>({
  connected: false,
  lastEvent: null,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    socket.connect();

    socket.on('connection_status', (status: { connected: boolean }) => {
      setConnected(status.connected);
    });

    // Listen to all events and update lastEvent
    const eventTypes = [
      'package_new',
      'event',
      'device_status',
      'qr_update',
      'wa_status',
    ];

    eventTypes.forEach((eventType) => {
      socket.on(eventType, (data: any) => {
        setLastEvent({ type: eventType, data, timestamp: Date.now() });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ connected, lastEvent }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
