/**
 * Test page specifically for useMatchWebSocket hook
 * Navigate to /match-websocket-test to use this
 */

import { useState } from 'react';
import { useMatchWebSocket } from '../hooks/useMatchWebSocket';
import { useAuth } from '../contexts/AuthContext';
import type { IncomingMessage } from '../types/websocket';

export default function MatchWebSocketTest() {
  const { accessToken, user } = useAuth();
  const [matchId, setMatchId] = useState<number>(1);
  const [enabled, setEnabled] = useState(false);
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [testMessage, setTestMessage] = useState('');

  const { send, status, isConnected, reconnect } = useMatchWebSocket({
    matchId,
    enabled,
    onMessage: (message) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] Received:`, message);
      setMessages((prev) => [{ ...message, timestamp }, ...prev]);
    },
  });

  const handleConnect = () => {
    setMessages([]);
    setEnabled(true);
  };

  const handleDisconnect = () => {
    setEnabled(false);
  };

  const handleSendTest = () => {
    if (!testMessage.trim()) return;

    send({
      type: 'test_message',
      data: { message: testMessage },
    });

    setTestMessage('');
  };

  const handleSendScoreUpdate = () => {
    send({
      type: 'score_update',
      data: {
        team1_score: Math.floor(Math.random() * 10),
        team2_score: Math.floor(Math.random() * 10),
      },
    });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'disconnected':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Match WebSocket Test</h1>
        <p className="text-gray-600 mb-8">Testing useMatchWebSocket hook</p>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>User:</strong>{' '}
              {user ? `${user.email} (ID: ${user.id})` : 'Not logged in'}
            </p>
            <p>
              <strong>Has Token:</strong> {accessToken ? '✅ Yes' : '❌ No'}
            </p>
            {!accessToken && (
              <p className="text-red-600 mt-2">
                ⚠️ You need to be logged in to test WebSockets
              </p>
            )}
          </div>
        </div>

        {/* Connection Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Controls</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Match ID:
              </label>
              <input
                type="number"
                value={matchId}
                onChange={(e) => setMatchId(Number(e.target.value))}
                disabled={enabled}
                className="border rounded px-3 py-2 w-full max-w-xs disabled:bg-gray-100"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a valid match ID from your database
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleConnect}
                disabled={!accessToken || enabled}
                className="px-4 py-2 rounded font-medium bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Connect
              </button>

              <button
                onClick={handleDisconnect}
                disabled={!enabled}
                className="px-4 py-2 rounded font-medium bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>

              {enabled && (
                <button
                  onClick={reconnect}
                  className="px-4 py-2 rounded font-medium bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Reconnect
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <span className={`font-semibold ${getStatusColor()}`}>
                {status.toUpperCase()}
              </span>
              {isConnected && (
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>

            {enabled && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <strong>WebSocket URL:</strong>{' '}
                <code className="break-all">
                  ws(s)://host/ws/8ball-match/{matchId}/?token=[token]
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Send Messages */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Send Test Messages</h2>

          <div className="space-y-4">
            {/* Custom message */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Custom Message:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendTest()}
                  placeholder="Enter test message..."
                  disabled={!isConnected}
                  className="flex-1 border rounded px-3 py-2 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendTest}
                  disabled={!isConnected || !testMessage.trim()}
                  className="px-4 py-2 rounded font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Quick action buttons */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Quick Actions:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSendScoreUpdate}
                  disabled={!isConnected}
                  className="px-4 py-2 rounded text-sm bg-purple-500 hover:bg-purple-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send Random Score
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Log */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Received Messages ({messages.length})
            </h2>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No messages received yet. Connect and wait for messages.
              </p>
            ) : (
              messages.map((message: any, index) => (
                <div
                  key={index}
                  className="border rounded p-3 bg-gray-50 font-mono text-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-orange-600">
                      {message.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp || ''} (#{messages.length - index})
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                    {JSON.stringify(message, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debug Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Testing Instructions:</h3>
          <ol className="list-decimal list-inside text-sm space-y-2">
            <li>Make sure you're logged in (check Auth Status above)</li>
            <li>Enter a valid match ID from your database</li>
            <li>Click "Connect" to establish WebSocket connection</li>
            <li>
              Open DevTools → Network → WS filter to see the WebSocket
              connection
            </li>
            <li>Send test messages and watch for responses</li>
            <li>
              In another tab/window, trigger match updates to see real-time
              messages
            </li>
          </ol>
        </div>

        {/* Backend Checklist */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Backend Checklist:</h3>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Is Django server running?</li>
            <li>
              Does the backend have a WebSocket consumer at{' '}
              <code className="bg-yellow-100 px-1 rounded">
                /ws/8ball-match/{'<match_id>'}/?token={'<token>'}
              </code>
              ?
            </li>
            <li>Check Django channels/Daphne logs for connection attempts</li>
            <li>Verify CORS and WebSocket settings in Django</li>
            <li>Check that the match ID exists in the database</li>
            <li>
              Verify the backend is configured to accept token authentication
              via query params
            </li>
          </ul>
        </div>

        {/* Hook Details */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold mb-3">useMatchWebSocket Hook Info:</h3>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>
              Located at:{' '}
              <code className="bg-green-100 px-1 rounded">
                src/hooks/useMatchWebSocket.ts
              </code>
            </li>
            <li>Uses react-use-websocket library for connection management</li>
            <li>Automatically reconnects on disconnect (5 attempts, 3s interval)</li>
            <li>Requires authentication token from AuthContext</li>
            <li>Returns: send(), status, isConnected, reconnect()</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
