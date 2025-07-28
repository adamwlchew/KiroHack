# PageFlow Mobile AR App

A React Native application with AR capabilities for the PageFlow AI Learning Platform.

## Features

- **Augmented Reality Learning**: Interactive AR experiences for educational content
- **Voice Interaction**: Speech-to-text and text-to-speech capabilities
- **Gesture Recognition**: Hand and body gesture controls
- **Real-time Collaboration**: Multi-user AR learning sessions
- **Accessibility Support**: Screen reader and voice command support
- **Offline Learning**: Download content for offline use

## Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- ARCore (Android) / ARKit (iOS)

## Installation

1. Install dependencies:
```bash
npm install
```

2. iOS setup:
```bash
cd ios && pod install && cd ..
```

3. Start Metro bundler:
```bash
npm start
```

4. Run on device/simulator:
```bash
# iOS
npm run ios

# Android
npm run android
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ar/             # AR-specific components
│   ├── navigation/     # Navigation components
│   └── ui/             # General UI components
├── screens/            # Screen components
│   ├── HomeScreen.tsx
│   ├── ARLearningScreen.tsx
│   ├── ProfileScreen.tsx
│   └── SettingsScreen.tsx
├── navigation/         # Navigation configuration
├── store/             # Redux store and slices
├── services/          # API and AR services
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── types/             # TypeScript type definitions
```

## AR Features

### AR Learning Experiences
- 3D model visualization
- Interactive simulations
- Spatial audio
- Hand tracking
- Object recognition

### Voice Commands
- "Start lesson"
- "Show me the 3D model"
- "Explain this concept"
- "Take a screenshot"
- "Share with classmates"

### Gesture Controls
- Pinch to zoom
- Swipe to navigate
- Tap to interact
- Hand gestures for commands

## Development

### Adding New AR Features

1. Create AR component in `src/components/ar/`
2. Add AR session management in `src/services/arService.ts`
3. Update navigation in `src/navigation/`
4. Add voice commands in `src/services/voiceService.ts`

### Testing AR Features

```bash
# Run tests
npm test

# Run AR-specific tests
npm test -- --testPathPattern=ar
```

## Building for Production

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## Troubleshooting

### Common Issues

1. **AR not working on device**
   - Ensure ARCore/ARKit is installed
   - Check device compatibility
   - Verify camera permissions

2. **Voice commands not responding**
   - Check microphone permissions
   - Verify speech recognition is enabled
   - Test with simple commands first

3. **Performance issues**
   - Reduce AR model complexity
   - Optimize textures and materials
   - Use lower resolution for older devices

## Contributing

1. Follow the existing code structure
2. Add TypeScript types for new features
3. Include AR accessibility features
4. Test on both iOS and Android
5. Update documentation

## License

This project is part of the PageFlow AI Learning Platform. 