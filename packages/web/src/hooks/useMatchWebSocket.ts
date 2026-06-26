/**
 * WebSocket hook for real-time match scoring
 * Built on top of react-use-websocket for reliable connection management
 */

import { useCallback, useMemo } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAuth } from '../contexts/AuthContext';
import type {
  OutgoingMessage,
  IncomingMessage,
  ConnectionStatus,
} from '../types/websocket';

interface UseMatchWebSocketOptions {
  matchId: number;
  enabled: boolean;
  onMessage?: (message: IncomingMessage) => void;
  /**
   * When false, the socket is receive-only: send() becomes a no-op. Used so
   * read-only viewers structurally cannot emit writes (the backend ignores
   * them too, but this keeps the client honest).
   */
  canWrite?: boolean;
}

interface UseMatchWebSocketReturn {
  send: (message: OutgoingMessage) => void;
  status: ConnectionStatus;
  isConnected: boolean;
  reconnect: () => void;
}

export function useMatchWebSocket({
  matchId,
  enabled,
  onMessage,
  canWrite = true,
}: UseMatchWebSocketOptions): UseMatchWebSocketReturn {
  const { accessToken } = useAuth();

  // Get WebSocket URL from API base URL
  const socketUrl = useMemo(() => {
    if (!enabled || !accessToken) {
      return null;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    // Convert HTTP(S) to WS(S)
    const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';

    // Extract host (remove /api suffix if present)
    const urlWithoutProtocol = apiBaseUrl.replace(/^https?:\/\//, '');
    const host = urlWithoutProtocol.replace(/\/api$/, '');

    return `${wsProtocol}://${host}/ws/8ball-match/${matchId}/?token=${accessToken}`;
  }, [matchId, enabled, accessToken]);

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: IncomingMessage = JSON.parse(event.data);
        onMessage?.(message);
      } catch {
        // Failed to parse WebSocket message
      }
    },
    [onMessage]
  );

  // Use react-use-websocket
  const { sendJsonMessage, readyState, getWebSocket } = useWebSocket(
    socketUrl,
    {
      onMessage: handleMessage,
      shouldReconnect: () => enabled,
      reconnectAttempts: 5,
      reconnectInterval: 3000,
      share: false, // Each match gets its own connection
    }
  );

  // Send message wrapper (no-op for read-only viewers)
  const send = useCallback(
    (message: OutgoingMessage) => {
      if (!canWrite) return;
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage(message);
      }
    },
    [sendJsonMessage, readyState, canWrite]
  );

  // Manual reconnect
  const reconnect = useCallback(() => {
    const ws = getWebSocket();
    if (ws) {
      ws.close();
    }
  }, [getWebSocket]);

  // Map ReadyState to ConnectionStatus
  const status: ConnectionStatus = useMemo(() => {
    switch (readyState) {
      case ReadyState.CONNECTING:
        return 'connecting';
      case ReadyState.OPEN:
        return 'connected';
      case ReadyState.CLOSING:
      case ReadyState.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }, [readyState]);

  return {
    send,
    status,
    isConnected: status === 'connected',
    reconnect,
  };
}
