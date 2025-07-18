import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const HLSVideoPlayer = ({ videoUrl, onError }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if the URL is for an HLS stream or a regular video file
    const isHls = videoUrl.endsWith('.m3u8') || videoUrl.includes('/hls/');
    const isMp4 = videoUrl.endsWith('.mp4');
    
    // Determine if it's a live stream
    setIsLive(isHls && !isMp4);
    
    // If it's a regular MP4 file or browser doesn't support HLS, just set the src directly
    if (isMp4 || !isHls || !Hls.isSupported()) {
      console.log('Using native video player for Firefox compatibility');
      video.src = videoUrl;
      return;
    }

    const hlsConfig = {
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      maxBufferHole: 0.5,
      maxBufferLength: 120,
      maxMaxBufferLength: 600,
      xhrSetup: xhr => { xhr.timeout = 60_000; },
      fragLoadingTimeOut: 20000,
      manifestLoadingTimeOut: 10000,
      fragLoadingMaxRetry: 4,
      manifestLoadingMaxRetry: 2,
    };

    const hls = new Hls(hlsConfig);
    hlsRef.current = hls;
    hls.loadSource(videoUrl);
    hls.attachMedia(video);

    let recoverCount = 0;
    const MAX_RECOV = 5;

    // Seek-forward "unstick" helper
    function seekForward() {
      const nextTime = Math.min(video.duration || Infinity, video.currentTime + 1);
      video.currentTime = nextTime;
      video.play().catch(() => {});
    }

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            console.error('[HLSVideoPlayer] Unrecoverable error:', data);
            onError?.(data);
            hls.destroy();
        }
      } else {
        // handle non-fatal stall conditions
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          hls.startLoad();
          seekForward();
        }
        else if (data.details === Hls.ErrorDetails.MEDIA_ERROR_BUFFER_LOW) {
          if (recoverCount < MAX_RECOV) {
            recoverCount++;
            hls.recoverMediaError();
          } else {
            console.error('[HLSVideoPlayer] Too many low-buffer recoveries');
            onError?.(data);
          }
        }
      }
    });

    // also catch native video stalls for HLS streams
    if (isHls) {
      video.addEventListener('waiting', seekForward);
      video.addEventListener('stalled', seekForward);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (isHls) {
        video.removeEventListener('waiting', seekForward);
        video.removeEventListener('stalled', seekForward);
      }
    };
  }, [videoUrl, onError]);

  return (
    <div className="video-wrapper">
      {isLive && <div className="live-indicator">LIVE</div>}
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        style={{ width: '100%', maxHeight: 400, background: '#000' }}
      />
    </div>
  );
};

export default HLSVideoPlayer;