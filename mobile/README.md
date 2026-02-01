# PatchPilot Mobile

React Native mobile app for PatchPilot - a self-healing QA agent for your codebase.

## Features

- 📊 **Dashboard** - View run statistics and recent activity
- 🏃 **Runs** - View, filter, and trigger new QA runs
- 📱 **Push Notifications** - Get notified when runs complete
- 🔐 **GitHub OAuth** - Secure authentication with GitHub
- 🌙 **Dark Mode** - Beautiful dark theme matching the web app

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
cd mobile
pnpm install
```

### Development

```bash
# Start Expo development server
pnpm start

# Run on iOS Simulator
pnpm ios

# Run on Android Emulator
pnpm android
```

### Environment Variables

Create a `.env` file in the mobile directory:

```env
EXPO_PUBLIC_API_URL=https://your-api-url.com
EXPO_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/            # Main tab screens
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Dashboard
│   │   ├── runs.tsx       # Runs list
│   │   ├── run/[id].tsx   # Run detail
│   │   └── settings.tsx
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── lib/
│   ├── api/              # API client
│   ├── hooks/            # Custom hooks
│   └── theme/            # Colors and styling
├── assets/               # Fonts, images, icons
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Tech Stack

- **Expo** ~52.0.0 - React Native framework
- **Expo Router** ~4.0.0 - File-based routing
- **SWR** - Data fetching and caching
- **expo-auth-session** - GitHub OAuth
- **expo-secure-store** - Secure token storage
- **expo-notifications** - Push notifications

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Sponsor Technologies

This app leverages WeaveHacks sponsor technologies:

- **W&B Weave** - Agent tracing and metrics via API
- **Redis** - Cached knowledge base patterns
- **Browserbase** - E2E testing triggered from mobile
- **Vercel** - Deployment status monitoring
- **Daily.co** - Voice command integration

## License

MIT
