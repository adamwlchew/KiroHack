# Cross-Platform Companion Implementation

## Overview

The Page companion is designed to provide a consistent experience across web, mobile AR, and VR platforms while adapting to platform-specific capabilities and user accessibility needs.

## Architecture

### Shared Components

- **CompanionService**: Interface for companion interactions
- **MockCompanionService**: Development implementation
- **useCompanion**: Cross-platform React hook
- **Platform Adapters**: Functions to adapt companion for specific platforms

### Platform-Specific Implementations

#### Web Platform
- Position: Corner, floating, or sidebar
- Interaction: Click and type
- Visual: Full avatar with animations
- Accessibility: Screen reader support, keyboard navigation

#### Mobile AR Platform
- Position: AR overlay in real world
- Interaction: Touch and voice
- Visual: 3D avatar in AR space
- Accessibility: Voice commands, large touch targets

#### VR Platform
- Position: Virtual space companion
- Interaction: Gaze, gesture, and voice
- Visual: Full-body presence
- Accessibility: Voice-only mode, reduced movement

## Implementation Guide

### 1. Using the Shared Hook

```typescript
import { useCompanion } from '@pageflow/utils/src/companion/useCompanion';

const MyComponent = () => {
  const { companion, interact, loading } = useCompanion({
    platform: 'web', // or 'mobile' or 'vr'
    userPreferences: {
      screenReaderOptimized: true,
      reducedMotion: false
    }
  });

  const handleInteraction = async (input: string) => {
    const response = await interact(input);
    console.log(response?.response);
  };

  return (
    // Your component JSX
  );
};
```

### 2. Platform-Specific Adaptations

The companion automatically adapts based on platform:

```typescript
// Web: Corner positioning with medium size
companion.appearance.platformSpecific.web = {
  position: 'corner',
  size: 'medium'
};

// Mobile: AR mode enabled
companion.appearance.platformSpecific.mobile = {
  arMode: true,
  size: 'medium'
};

// VR: Full-body presence
companion.appearance.platformSpecific.vr = {
  presence: 'full-body',
  distance: 'medium'
};
```

### 3. Accessibility Adaptations

```typescript
// Screen reader optimization
if (userPreferences.screenReaderOptimized) {
  companion.appearance.avatarType = 'text-only';
}

// Reduced motion
if (userPreferences.reducedMotion) {
  companion.appearance.animationLevel = 'none';
}
```

## State Management

### Redux Integration (Web)

```typescript
// Use the companion slice for web applications
import { fetchCompanion, interactWithCompanion } from '@/store/slices/companionSlice';

const dispatch = useAppDispatch();
dispatch(fetchCompanion());
dispatch(interactWithCompanion('Hello Page!'));
```

### Direct Hook Usage (Mobile/VR)

```typescript
// Use the hook directly for mobile and VR
const { companion, interact } = useCompanion({
  platform: 'mobile',
  userPreferences: userPrefs
});
```

## Testing Cross-Platform Consistency

### Unit Tests

```typescript
import { MockCompanionService } from '@pageflow/utils/src/companion/companionService';

describe('Companion Service', () => {
  it('should provide consistent responses across platforms', async () => {
    const service = new MockCompanionService();
    const response = await service.interactWithCompanion('Hello');
    expect(response.response).toBeDefined();
    expect(response.emotionalState).toBeDefined();
  });
});
```

### Integration Tests

- Test companion behavior on each platform
- Verify accessibility adaptations work correctly
- Ensure emotional state updates consistently
- Test platform-specific appearance settings

## Best Practices

1. **Consistent Personality**: Maintain the same personality traits across platforms
2. **Adaptive UI**: Adjust visual representation based on platform capabilities
3. **Accessibility First**: Always consider accessibility needs in adaptations
4. **Performance**: Optimize for each platform's performance characteristics
5. **Error Handling**: Provide graceful fallbacks when companion services fail

## Future Enhancements

- Real-time companion service integration
- Advanced emotional state management
- Platform-specific gesture recognition
- Voice interaction improvements
- Multi-language support