
# Image to Video API Market App

A Next.js web application that converts images into short videos using MagicAPI's WAN Image-to-Video model. Upload an image, provide a prompt describing the desired motion, and generate dynamic videos with AI.

## Features

- 🖼️ **Image Upload**: Drag-and-drop or file selection with preview
- 🎬 **Video Generation**: AI-powered image-to-video conversion with custom prompts
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 📚 **History Panel**: Track all your generated videos with local storage
- 🔐 **Secure API Key Management**: Client-side API key storage (no server secrets)
- ⚡ **Real-time Status Updates**: Live polling of upload and generation progress
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and shadcn/ui

## Demo

Visit the live demo: [Click here](https://apimarket1.netlify.app/)

## API Integration

This app integrates with MagicAPI's endpoints:
- **Image Upload**: `POST https://api.market/store/magicapi/image-upload`
- **Status Polling**: `GET {uploadId}/status`
- **Video Generation**: `POST https://api.market/store/magicapi/wan-text-to-image`

## Prerequisites

- Node.js 18+ and npm
- MagicAPI account and API key ([Get yours here](https://api.market/store/magicapi))

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rohitszx/image-to-video-api-market-app.git
   cd image-to-video-api-market-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

1. **Set up your API key**
   - On first visit, you'll be prompted to enter your MagicAPI key
   - The key is stored securely in your browser's local storage

2. **Upload an image**
   - Drag and drop an image file or click to browse
   - Supported formats: JPG, PNG, GIF, WebP

3. **Generate a video**
   - Enter a prompt describing the motion you want (e.g., "The person smiles and waves")
   - Click "Generate Video" and wait for the AI to work its magic

4. **View and download**
   - Watch your generated video in the preview player
   - Download the video file to your device
   - Access all your previous generations in the history panel

## Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── ApiKeySetup.tsx     # API key input form
│   ├── ImageUpload.tsx     # Image upload with drag-and-drop
│   ├── VideoGenerator.tsx  # Video generation interface
│   └── HistoryPanel.tsx    # Generation history display
├── lib/api/
│   └── magic-api.ts         # MagicAPI service client
├── hooks/
│   └── useLocalStorage.ts  # Local storage hook
└── app/
    └── page.tsx           # Main application page
```

## Technical Details

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks with local storage persistence
- **API Client**: Custom service class with polling and error handling
- **Type Safety**: Full TypeScript implementation

## API Key Security

Your MagicAPI key is:
- ✅ Stored only in your browser's local storage
- ✅ Never sent to any server except MagicAPI
- ✅ Never logged or transmitted to third parties
- ✅ Completely under your control

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request





