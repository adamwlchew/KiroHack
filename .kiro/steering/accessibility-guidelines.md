# Accessibility Guidelines

## Core Requirements

- All platform features must meet WCAG 2.1 AA standards
- Support users with diverse needs across web, mobile AR, and VR platforms
- Implement platform-specific accessibility adaptations
- Test all features with assistive technologies

## Cross-Platform Accessibility

### Web Accessibility
- Use semantic HTML structure
- Implement proper ARIA attributes
- Support keyboard navigation
- Manage focus appropriately
- Provide text alternatives for images
- Use proper heading structure
- Implement ARIA live regions for dynamic content

### Mobile Accessibility
- Support iOS VoiceOver and Android TalkBack
- Implement large touch targets (minimum 44x44 points)
- Provide touch alternatives
- Support gesture simplification
- Consider device orientation
- Implement vibration feedback options
- Support voice commands

### VR Accessibility
- Implement gaze-based interaction alternatives
- Support voice command controls
- Provide single-button mode
- Include reduced visual stimulation options
- Offer audio description alternatives
- Implement haptic feedback
- Provide seated mode options
- Reduce movement requirements
- Include fatigue reduction features

## User Preference Support

- Implement screen reader compatibility
- Support high contrast mode
- Provide reduced motion settings
- Offer text size adjustment
- Adapt content to reading level preferences
- Support alternative input methods (switch devices, voice commands, eye tracking)
- Allow customization of Page companion interaction methods

## Testing Requirements

- Test with popular screen readers (NVDA, VoiceOver, JAWS, TalkBack)
- Verify keyboard-only navigation
- Test with various assistive technologies
- Conduct user testing with people with disabilities
- Run automated accessibility checks
- Verify color contrast compliance
- Test with different text sizes