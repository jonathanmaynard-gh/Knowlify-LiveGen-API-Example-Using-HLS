/**
 * HLS service utility functions for video handling
 */

/**
 * Ensures an HLS URL is properly formatted with the playlist file
 * @param {string} url - The HLS URL to format
 * @returns {string|null} The formatted URL or null if invalid
 */
export const formatHlsUrl = (url) => {
  if (!url) return null;
  
  // If URL is empty or not a string
  if (typeof url !== 'string' || url.trim() === '') {
    return null;
  }
  
  // URL already has .m3u8 extension - just ensure the query parameters are preserved
  if (url.includes('.m3u8')) {
    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch (e) {
      console.error('Error parsing m3u8 URL:', e);
      return url;
    }
  }
  
  // Handle HLS URLs that need playlist.m3u8 added
  if (url.includes('/hls/')) {
    let baseUrl = url;
    let queryParams = '';
    
    // Extract query parameters if they exist
    if (url.includes('?')) {
      const parts = url.split('?');
      baseUrl = parts[0];
      queryParams = `?${parts[1]}`;
    }
    
    // Add playlist.m3u8 to the URL
    if (baseUrl.endsWith('/')) {
      return `${baseUrl}playlist.m3u8${queryParams}`;
    } else {
      return `${baseUrl}/playlist.m3u8${queryParams}`;
    }
  }
  
  // Not an HLS URL, return as is
  return url;
};

/**
 * Checks if the browser supports HLS playback
 * @returns {Object} Object containing support information
 */
export const checkHlsSupport = () => {
  try {
    // Try to import Hls from hls.js
    const Hls = require('hls.js');
    
    // Create a video element to check for native HLS support
    const videoEl = document.createElement('video');
    const hasNativeHls = videoEl.canPlayType && 
                        typeof videoEl.canPlayType === 'function' && 
                        videoEl.canPlayType('application/vnd.apple.mpegurl') !== '';
    
    // Check if hls.js is supported by testing for MSE
    const hasHlsJs = Hls.isSupported();
    
    return {
      hlsJsSupported: hasHlsJs,
      nativeHlsSupported: hasNativeHls,
      isSupported: hasHlsJs || hasNativeHls
    };
  } catch (error) {
    console.error('Error checking HLS support:', error);
    return {
      hlsJsSupported: false,
      nativeHlsSupported: false,
      isSupported: false
    };
  }
}; 