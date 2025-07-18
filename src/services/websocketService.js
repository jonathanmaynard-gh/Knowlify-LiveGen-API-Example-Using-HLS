const WEBSOCKET_URL = 'wss://50fa8sjxo9.execute-api.us-west-2.amazonaws.com/production';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

class WebSocketService {
  constructor() {
    this.client = null;
    this.retryCount = 0;
    this.messageHandler = null;
    this.closeHandler = null;
    this.isConnecting = false;
    this.isConnected = false;
    this.intentionalClose = false;
  }

  async connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.isConnected) {
      console.log('[WebSocket] Already connecting or connected, skipping...');
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.intentionalClose = false;

    return new Promise((resolve, reject) => {
      // Close any existing connection before creating a new one
      if (this.client) {
        console.log('[WebSocket] Closing existing connection');
        this.intentionalClose = true;
        this.client.close();
        this.client = null;
      }

      console.log('[WebSocket] Attempting to establish connection...');
      
      try {
        this.client = new WebSocket(WEBSOCKET_URL);
      } catch (error) {
        console.error('[WebSocket] Failed to create WebSocket:', error);
        this.isConnecting = false;
        reject(error);
        return;
      }

      const connectionTimeout = setTimeout(() => {
        console.error('[WebSocket] Connection timeout');
        this.isConnecting = false;
        if (this.client) {
          this.client.close();
        }
        reject(new Error('Connection timeout'));
      }, 10000); // 10 second timeout

      this.client.onopen = () => {
        console.log('[WebSocket] Connection established successfully');
        clearTimeout(connectionTimeout);
        this.retryCount = 0;
        this.isConnecting = false;
        this.isConnected = true;
        resolve();
      };

      this.client.onmessage = (message) => {
        console.log('[WebSocket] Message received:', message.data);
        try {
          const data = JSON.parse(message.data);
          if (!data.message || data.message !== "Internal server error") {
            if (data.link && (data.link.includes('/hls/') || data.link.endsWith('.m3u8'))) {
              console.log('[WebSocket] HLS stream URL received:', data.link);
            } else if (data.mp4_link && (data.mp4_link.includes('/hls/') || data.mp4_link.endsWith('.m3u8'))) {
              console.log('[WebSocket] HLS stream URL received in mp4_link field:', data.mp4_link);
            } else if (data.mp4_link) {
              console.log('[WebSocket] MP4 video URL received:', data.mp4_link);
            }
            
            if (this.messageHandler) {
              this.messageHandler(data);
            }
          } else {
            console.warn('[WebSocket] Internal server error:', data);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.client.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event);
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.isConnected = false;

        // Only retry if it wasn't an intentional close and we haven't exceeded max retries
        if (!this.intentionalClose && this.retryCount < MAX_RETRIES) {
          console.log(`[WebSocket] Attempting reconnection ${this.retryCount + 1}/${MAX_RETRIES}`);
          setTimeout(() => {
            this.retryCount++;
            this.connect().catch((error) => {
              console.error('[WebSocket] Reconnection failed:', error);
            });
          }, RETRY_DELAY);
        } else if (this.retryCount >= MAX_RETRIES) {
          console.error('[WebSocket] Max reconnection attempts reached');
          if (this.closeHandler) {
            this.closeHandler();
          }
        }
      };

      this.client.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.isConnected = false;
        reject(error);
      };
    });
  }

  disconnect() {
    if (this.client) {
      console.log('[WebSocket] Intentionally disconnecting');
      this.intentionalClose = true;
      this.isConnected = false;
      this.isConnecting = false;
      this.retryCount = 0;
      this.client.close();
      this.client = null;
    }
  }

  onMessage(handler) {
    this.messageHandler = handler;
  }

  createVideo(task, apiKey) {
    if (!this.client || this.client.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const payload = {
      action: 'new-create-video',
      task: task,
      api_key: apiKey
    };
    console.log('[WebSocket] Sending task:', task);
    this.client.send(JSON.stringify(payload));
  }

  getConnectionState() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      retryCount: this.retryCount
    };
  }
}

export default new WebSocketService(); 