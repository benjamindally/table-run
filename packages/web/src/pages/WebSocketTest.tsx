/**
 * Bare-bones WebSocket test page
 * Navigate to /websocket-test to use this
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function WebSocketTest() {
  const { accessToken, user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState('Not connected');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
    console.log(`[WebSocket Test] ${message}`);
  };

  const connectWebSocket = () => {
    if (!accessToken) {
      addLog('ERROR: No access token available');
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${accessToken}`;
    addLog(`Attempting to connect to: ${wsUrl}`);

    try {
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        addLog('✅ WebSocket CONNECTED');
        setStatus('Connected');
      };

      websocket.onmessage = (event) => {
        addLog(`📩 Message received: ${event.data}`);
      };

      websocket.onerror = (error) => {
        addLog(`❌ WebSocket ERROR: ${JSON.stringify(error)}`);
        setStatus('Error');
      };

      websocket.onclose = (event) => {
        addLog(`🔌 WebSocket CLOSED - Code: ${event.code}, Reason: ${event.reason || 'No reason'}, Clean: ${event.wasClean}`);
        setStatus('Disconnected');
      };

      setWs(websocket);
    } catch (error) {
      addLog(`❌ Exception while creating WebSocket: ${error}`);
    }
  };

  const disconnect = () => {
    if (ws) {
      addLog('Manually closing connection...');
      ws.close();
      setWs(null);
    }
  };

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WebSocket Test Page</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User:</strong> {user ? `${user.email} (ID: ${user.id})` : 'Not logged in'}</p>
            <p><strong>Has Token:</strong> {accessToken ? '✅ Yes' : '❌ No'}</p>
            {accessToken && (
              <p className="break-all"><strong>Token:</strong> {accessToken.substring(0, 50)}...</p>
            )}
          </div>
        </div>

        {/* Connection Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Controls</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={connectWebSocket}
              disabled={!accessToken || ws !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Connect
            </button>
            <button
              onClick={disconnect}
              disabled={ws === null}
              className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-300"
            >
              Disconnect
            </button>
            <button
              onClick={() => setLogs([])}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Clear Logs
            </button>
          </div>
          <p className="text-lg">
            <strong>Status:</strong>
            <span className={`ml-2 ${status === 'Connected' ? 'text-green-600' : status === 'Error' ? 'text-red-600' : 'text-gray-600'}`}>
              {status}
            </span>
          </p>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click "Connect" to start.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Make sure you're logged in (check Auth Status above)</li>
            <li>Click "Connect" to establish WebSocket connection</li>
            <li>Check the logs for connection success or error details</li>
            <li>In another tab/browser, create a new announcement</li>
            <li>Watch this page for incoming messages</li>
            <li>If you see "WebSocket CLOSED" immediately, check the backend logs</li>
          </ol>
        </div>

        {/* Backend Checklist */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Backend Checklist</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Is Django server running on localhost:8000?</li>
            <li>Does the WebSocket consumer accept token in query params?</li>
            <li>Check Django logs for WebSocket connection attempts</li>
            <li>Verify CORS/CSRF settings allow WebSocket connections</li>
            <li>Test the token is valid: <code className="bg-yellow-100 px-2 py-1 rounded">curl -H "Authorization: Bearer [token]" http://localhost:8000/api/notifications/</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
