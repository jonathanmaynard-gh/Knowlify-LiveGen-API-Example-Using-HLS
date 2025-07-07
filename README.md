# Example of how to use Knowlify's Live-Gen API using HLS

## Features

- HLS video streaming support using hls.js
- Video generation via WebSocket connection
- Live stream detection and indicators
- Basic Error handling and recovery
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### How to test live-gen

- Type in your prompt and submit. After ~15 seconds, a video will appear in the video player. This video is streamed in, so segments of the video will load in with time.

## Technical Details

- **HLS Support**: Uses hls.js library for HLS playback
- **WebSocket**: Connects to AI video generation service
- **Error Recovery**: Implements automatic recovery for network and media errors
- **Live Detection**: Automatically detects and indicates live streams

## WebSocket API

The app connects to the video generation service at:
```
wss://50fa8sjxo9.execute-api.us-west-2.amazonaws.com/production
```

**Request Format:**
```json
{
  "action": "new-create-video",
  "task": "a cat walking"
}
```

**Response Format:**
```json
{
  "link": "https://generated-video-url.com/video.m3u8",
  "status": "Video generation complete"
}
```

## Browser Support

- Chrome, Firefox, Safari, Edge (modern versions)
- HLS support via hls.js for browsers without native HLS support
- WebSocket support for real-time communication

## Dependencies

- React 18.2.0
- hls.js 1.4.12
- react-scripts 5.0.1 