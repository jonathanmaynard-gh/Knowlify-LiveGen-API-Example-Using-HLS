import React, { useState, useEffect } from 'react';
import HLSVideoPlayer from './components/HLSVideoPlayer';
import VideoGenerator from './components/VideoGenerator';
import { formatHlsUrl, checkHlsSupport } from './services/hlsService';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState(null);
  const [hlsSupport, setHlsSupport] = useState(null);

  useEffect(() => {
    // Check HLS support on component mount
    const support = checkHlsSupport();
    setHlsSupport(support);
  }, []);

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  const handleLoadVideo = () => {
    if (!videoUrl.trim()) {
      setError('Please enter a video URL');
      return;
    }

    const formattedUrl = formatHlsUrl(videoUrl);
    setCurrentUrl(formattedUrl);
    setError(null);
  };

  const handleVideoError = (error) => {
    console.error('Video error:', error);
    setError(`Video playback error: ${error.details || error.message || 'Unknown error'}`);
  };

  const handleVideoGenerated = (generatedUrl) => {
    console.log('Generated video URL:', generatedUrl);
    setVideoUrl(generatedUrl);
    setCurrentUrl(generatedUrl);
    setError(null);
  };

  return (
    <div className="container">
      <h1>Example Live-Gen using HLS</h1>
      
      {/* HLS Support Status */}
      {hlsSupport && (
        <div className={`status ${hlsSupport.isSupported ? 'success' : 'error'}`}>
          <strong>HLS Support:</strong> 
          {hlsSupport.isSupported ? ' ✅ Supported' : ' ❌ Not Supported'}
          {hlsSupport.hlsJsSupported && ' (via hls.js)'}
          {hlsSupport.nativeHlsSupported && ' (native)'}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="status error">
          {error}
        </div>
      )}

      {/* AI Video Generator */}
      <VideoGenerator onVideoGenerated={handleVideoGenerated} />

      {/* Video Player - Always visible */}
      <div className="video-section">
        <h3>Video Player</h3>
        {currentUrl ? (
          <HLSVideoPlayer 
            videoUrl={currentUrl} 
            onError={handleVideoError}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '400px', 
            background: '#f8f9fa', 
            border: '2px dashed #dee2e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center', color: '#6c757d' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No video loaded</div>
              <div style={{ fontSize: '14px' }}>Generate a video above or load a URL below</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 