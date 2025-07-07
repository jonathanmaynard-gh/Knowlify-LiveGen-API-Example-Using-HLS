/**
 * WebSocket service for video generation
 */

class WebSocketService {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.messageHandlers = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket('wss://50fa8sjxo9.execute-api.us-west-2.amazonaws.com/production');
        
        this.websocket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            this.messageHandlers.forEach(handler => handler(data));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
        };

      } catch (error) {
        console.error('Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      this.isConnected = false;
    }
  }

  sendMessage(action, task) {
    if (!this.isConnected || !this.websocket) {
      throw new Error('WebSocket is not connected');
    }

    const payload = {
      action: action,
      task: task
    };

    this.websocket.send(JSON.stringify(payload));
  }

  createVideo(task) {
    return this.sendMessage('new-create-video', task);
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }
}

export default new WebSocketService(); 