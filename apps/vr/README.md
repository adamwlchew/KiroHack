# PageFlow VR Learning Application

A WebGL/Unity-based VR application for immersive learning experiences in the PageFlow AI Learning Platform.

## Features

- **Immersive VR Learning**: Full 360° virtual learning environments
- **Interactive 3D Models**: Manipulate and explore educational content
- **Spatial Audio**: 3D audio for enhanced immersion
- **Hand Tracking**: Natural hand interactions with virtual objects
- **Voice Commands**: Speech recognition for hands-free operation
- **Multi-user VR**: Collaborative learning in shared virtual spaces
- **Accessibility**: VR accessibility features for users with disabilities
- **Cross-platform**: Works on Oculus, HTC Vive, and WebVR browsers

## Prerequisites

- Node.js 18+
- Unity 2022.3 LTS (for Unity builds)
- WebVR-compatible browser
- VR headset (optional for development)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open in VR-compatible browser:
```
http://localhost:8080
```

## Project Structure

```
src/
├── components/          # VR components and entities
│   ├── scenes/         # VR scene definitions
│   ├── interactions/   # Interaction components
│   ├── ui/            # VR UI components
│   └── audio/         # Audio components
├── assets/            # 3D models, textures, audio
│   ├── models/        # 3D models (.gltf, .obj)
│   ├── textures/      # Texture files
│   ├── audio/         # Audio files
│   └── environments/  # Environment maps
├── scripts/           # JavaScript/TypeScript logic
│   ├── controllers/   # VR controllers
│   ├── interactions/  # Interaction logic
│   ├── networking/    # Multi-user networking
│   └── utils/         # Utility functions
├── scenes/            # A-Frame scene files
├── styles/            # CSS styles
└── index.html         # Main entry point
```

## VR Features

### Learning Environments
- Virtual classrooms
- Interactive laboratories
- Historical simulations
- Scientific visualizations
- Art galleries and museums

### Interaction Methods
- Hand controllers
- Gaze interaction
- Voice commands
- Gesture recognition
- Teleportation

### Accessibility Features
- Screen reader support
- Voice navigation
- High contrast modes
- Motion sickness reduction
- One-handed operation

## Development

### Adding New VR Scenes

1. Create scene file in `src/scenes/`
2. Add 3D models to `src/assets/models/`
3. Create interaction components in `src/components/interactions/`
4. Update navigation in `src/scripts/controllers/`

### Voice Commands

```javascript
// Example voice command
AFRAME.registerComponent('voice-commands', {
  init: function() {
    this.el.addEventListener('voicecommand', (event) => {
      switch(event.detail.command) {
        case 'start lesson':
          this.startLesson();
          break;
        case 'show model':
          this.showModel();
          break;
      }
    });
  }
});
```

### Multi-user Features

```javascript
// Example multi-user component
AFRAME.registerComponent('multi-user', {
  init: function() {
    this.socket = io('ws://localhost:3000');
    this.socket.on('user-joined', this.onUserJoined.bind(this));
    this.socket.on('user-left', this.onUserLeft.bind(this));
  }
});
```

## Building

### WebGL Build
```bash
npm run build
```

### Unity Build
```bash
npm run unity:build
```

## Testing

### VR Testing
```bash
npm test
```

### Performance Testing
```bash
npm run test:performance
```

## Deployment

### Web Deployment
1. Build the application:
```bash
npm run build
```

2. Deploy `dist/` folder to web server

### Unity Build Deployment
1. Build Unity project
2. Package for target platforms (Oculus, SteamVR, etc.)

## Performance Optimization

### 3D Model Optimization
- Use compressed textures
- Optimize polygon count
- Implement LOD (Level of Detail)
- Use texture atlasing

### Rendering Optimization
- Implement frustum culling
- Use occlusion culling
- Optimize lighting
- Reduce draw calls

### Network Optimization
- Compress network data
- Implement prediction
- Use efficient protocols
- Optimize bandwidth usage

## Troubleshooting

### Common Issues

1. **VR not detected**
   - Check WebVR support
   - Verify headset connection
   - Update browser drivers

2. **Performance issues**
   - Reduce model complexity
   - Optimize textures
   - Check hardware requirements

3. **Audio not working**
   - Check audio permissions
   - Verify spatial audio setup
   - Test with different browsers

## Contributing

1. Follow VR development best practices
2. Test on multiple VR platforms
3. Include accessibility features
4. Optimize for performance
5. Document new features

## License

This project is part of the PageFlow AI Learning Platform. 