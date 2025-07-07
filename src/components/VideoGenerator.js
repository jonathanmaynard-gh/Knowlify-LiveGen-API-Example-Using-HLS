import React, { useState, useEffect } from 'react';
import websocketService from '../services/websocketService';

const VideoGenerator = ({ onVideoGenerated }) => {
  const [task, setTask] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Connect to WebSocket on component mount
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      setStatus('Connecting to video generation service...');
      await websocketService.connect();
      setIsConnected(true);
      setStatus('Connected to video generation service');
      setError('');

      // Set up message handler
      websocketService.onMessage(handleWebSocketMessage);
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect to video generation service');
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    console.log('Received video generation message:', data);
    
    if (data.link) {
      setStatus('Video generated successfully!');
      setIsGenerating(false);
      onVideoGenerated(data.link);
    } else if (data.status) {
      setStatus(data.status);
    } else if (data.error) {
      setError(data.error);
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!task.trim()) {
      setError('Please enter a task description');
      return;
    }

    if (!isConnected) {
      setError('Not connected to video generation service');
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      setStatus('Generating video...');
      
      websocketService.createVideo(task);
    } catch (error) {
      console.error('Error generating video:', error);
      setError('Failed to send video generation request');
      setIsGenerating(false);
    }
  };

  const handleTaskChange = (e) => {
    setTask(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="video-section">
      <h3>Live-Gen</h3>
      
      {/* Connection Status */}
      <div className={`status ${isConnected ? 'success' : 'error'}`}>
        <strong>Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Error Display */}
      {error && (
        <div className="status error">
          {error}
        </div>
      )}

      {/* Status Display */}
      {status && !error && (
        <div className="status success">
          {status}
        </div>
      )}

      {/* Task Input */}
      <div className="controls">
        <textarea
          value={task}
          onChange={handleTaskChange}
          placeholder="Describe the video you want to generate (e.g., 'teach me how to derivate using power rule', 'what are the stages of photosynthesis?')"
          rows="3"
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginBottom: '10px', 
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical'
          }}
          disabled={isGenerating}
        />
        
        <button 
          onClick={handleGenerateVideo}
          disabled={!isConnected || isGenerating || !task.trim()}
          style={{ 
            background: isGenerating ? '#6c757d' : '#007bff',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Video'}
        </button>

        {!isConnected && (
          <button onClick={connectWebSocket} style={{ marginLeft: '10px' }}>
            Reconnect
          </button>
        )}
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <strong>How it works:</strong>
        <ul style={{ marginTop: '5px' }}>
          <li>Enter a description of the video you want to generate</li>
          <li>Click "Generate Video" to send the request</li>
          <li>Wait for our system to process and generate your video</li>
          <li>The generated video URL will automatically appear in the player below</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoGenerator; 
