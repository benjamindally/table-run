/**
 * WebSocket hook for real-time match scoring in React Native
 * Uses native WebSocket API with custom reconnection logic
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { API_BASE_URL } from "../config";
import type {
  OutgoingMessage,
  IncomingMessage,
  ConnectionStatus,
} from "@league-genius/shared";

interface UseMatchWebSocketOptions {
  matchId: number;
  enabled: boolean;
  onMessage?: (message: IncomingMessage) => void;
}

interface UseMatchWebSocketReturn {
  send: (message: OutgoingMessage) => void;
  status: ConnectionStatus;
  isConnected: boolean;
  reconnect: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

export function useMatchWebSocket({
  matchId,
  enabled,
  onMessage,
}: UseMatchWebSocketOptions): UseMatchWebSocketReturn {
  const accessToken = useAuthStore((state) => state.accessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // Always holds the latest onMessage so ws.onmessage never goes stale
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Build WebSocket URL
  const getSocketUrl = useCallback(() => {
    // Convert HTTP(S) to WS(S)
    const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";

    // Extract host (remove /api suffix if present)
    const urlWithoutProtocol = API_BASE_URL.replace(/^https?:\/\//, "");
    const host = urlWithoutProtocol.replace(/\/api$/, "");

    // Include token if authenticated, otherwise connect without auth
    const tokenParam = accessToken ? `?token=${accessToken}` : "";
    return `${wsProtocol}://${host}/ws/8ball-match/${matchId}/${tokenParam}`;
  }, [matchId, accessToken]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const url = getSocketUrl();
    setStatus("connecting");

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: IncomingMessage = JSON.parse(event.data);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setStatus("error");
      };

      ws.onclose = () => {
        setStatus("disconnected");
        wsRef.current = null;

        // Attempt reconnection if enabled and under max attempts
        if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[WebSocket] Failed to connect:", error);
      setStatus("error");
    }
  }, [enabled, getSocketUrl]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Send message
  const send = useCallback((message: OutgoingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send - not connected");
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, matchId, accessToken]);

  // Handle app state changes (reconnect when coming back to foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && enabled) {
        // Check if we need to reconnect
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reconnect();
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [enabled, reconnect]);

  return {
    send,
    status,
    isConnected: status === "connected",
    reconnect,
  };
}
