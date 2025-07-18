import React, { useState, useEffect, useRef } from 'react';
import websocketService from '../services/websocketService';

const VideoGenerator = ({ onVideoGenerated }) => {
  const [task, setTask] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [hasReceivedVideoUrl, setHasReceivedVideoUrl] = useState(false);
  
  // Connection state tracking
  const hasClosedWebSocketRef = useRef(false);

  useEffect(() => {
    connectWebSocket();
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
      hasClosedWebSocketRef.current = false;

      websocketService.onMessage(handleWebSocketMessage);
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect to video generation service');
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    console.log('[VideoGenerator] Received video generation message:', data);
    
    // Prevent processing if we've already received a video
    if (hasClosedWebSocketRef.current) {
      console.log('[VideoGenerator] Ignoring message because video already received');
      return;
    }

    let videoLinkToPlay = null;

    // Enhanced HLS vs MP4 handling - prioritize HLS for live generation
    if (data.link) {
      const isMP4Link = data.link.includes('.mp4') || data.link.includes('/mp4/');
      console.log('[VideoGenerator] Processing link:', data.link, 'isMP4:', isMP4Link);
      
      // For live generation, prefer HLS streams
      if (!isMP4Link) {
        videoLinkToPlay = data.link;
        console.log('[VideoGenerator] Using HLS stream link:', videoLinkToPlay);
      }
    }
    
    // Fallback to MP4 if no HLS available
    if (!videoLinkToPlay && data.mp4_link) {
      console.warn('[VideoGenerator] No HLS link available, using MP4 fallback:', data.mp4_link);
      videoLinkToPlay = data.mp4_link;
    }

    // Process successful video generation
    if (videoLinkToPlay && !hasClosedWebSocketRef.current) {
      console.log('[VideoGenerator] Video generation successful, URL:', videoLinkToPlay);
      setStatus('Video generated successfully!');
      setIsGenerating(false);
      setHasReceivedVideoUrl(true);
      hasClosedWebSocketRef.current = true;
      
      onVideoGenerated(videoLinkToPlay);
      
      // Clean up WebSocket connection
      websocketService.disconnect();
      setIsConnected(false);
      return;
    }

    // Handle status updates
    if (data.status && !hasClosedWebSocketRef.current) {
      setStatus(data.status);
      
      if (data.status === 'complete') {
        setIsGenerating(false);
      }
    }

    // Handle errors
    if (data.error) {
      console.error('[VideoGenerator] Generation error:', data.error);
      setError(data.error);
      setIsGenerating(false);
      hasClosedWebSocketRef.current = true;
    }
  };

  const handleGenerateVideo = async () => {
    if (!task.trim()) {
      setError('Please enter a task description');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your API key (GENERATE YOUR API KEY IN YOUR ACCOUNT PANEL ON demo.knowlify.net)');
      return;
    }

    if (!isConnected) {
      // Try to reconnect
      await connectWebSocket();
      if (!isConnected) {
        setError('Failed to connect to video generation service');
        return;
      }
    }

    try {
      setIsGenerating(true);
      setError('');
      setStatus('Generating video...');
      setHasReceivedVideoUrl(false);
      hasClosedWebSocketRef.current = false;
      
      websocketService.createVideo(task, apiKey);
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

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    if (error) setError('');
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isGenerating) {
        handleGenerateVideo();
      }
    }
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

      {/* API Key Input */}
      <div className="controls">
        <input
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your API key"
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginBottom: '10px', 
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          disabled={isGenerating}
        />
      </div>

      {/* Task Input */}
      <div className="controls">
        <textarea
          value={task}
          onChange={handleTaskChange}
          onKeyDown={handleKeyDown}
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
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleGenerateVideo}
            disabled={!isConnected || isGenerating || !task.trim() || !apiKey.trim()}
            style={{ 
              background: isGenerating ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              flex: '1'
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Video'}
          </button>

          {!isConnected && (
            <button 
              onClick={connectWebSocket} 
              style={{ 
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <strong>How Live-Gen works:</strong>
        <ul style={{ marginTop: '5px' }}>
          <li>Enter your API key from demo.knowlify.net</li>
          <li>Describe the video you want to generate in detail</li>
          <li>Click "Generate Video" to start live generation</li>
          <li>Receive your HLS video stream when complete</li>
        </ul>
        <div style={{ marginTop: '10px', padding: '8px', background: '#e7f3ff', borderRadius: '4px', fontSize: '13px' }}>
          <strong>💡 Tip:</strong> Live-Gen creates videos in real-time with HLS streaming for immediate playback!
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator; 
