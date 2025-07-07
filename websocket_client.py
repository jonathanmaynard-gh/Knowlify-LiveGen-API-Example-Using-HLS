import json
import websocket

class WebSocketClient:
    def __init__(self):
        self.ws = None
        self.api_key = "knowlify_e95124085de84614a7b7fbf244561835"
        self.url = "wss://50fa8sjxo9.execute-api.us-west-2.amazonaws.com/production"
    
    def connect(self):
        self.ws = websocket.create_connection(self.url)
        print("Connected to WebSocket")
    
    def send_message(self, action, task):
        payload = {
            "api_key": self.api_key,
            "action": action,
            "task": task
        }
        self.ws.send(json.dumps(payload))
        print(f"Sent: {payload}")
    
    def create_video(self, task):
        self.send_message("new-create-video", task)
    
    def receive_message(self):
        message = self.ws.recv()
        return json.loads(message)
    
    def close(self):
        if self.ws:
            self.ws.close()
            print("WebSocket closed")

# Usage example:
if __name__ == "__main__":
    client = WebSocketClient()
    
    try:
        client.connect()
        
        # Example task
        task = {"prompt": "Create a video about cats"}
        client.create_video(task)
        
        # Listen for response
        response = client.receive_message()
        print(f"Received: {response}")
        
    finally:
        client.close() 