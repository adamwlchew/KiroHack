import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { updateUserPreferences } from '@/store/slices/userSlice';

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SettingGroup = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
`;

const SettingTitle = styled.h3`
  font-size: 1rem;
  color: #333;
  margin: 0 0 1rem 0;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.label`
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #4a6cfa;
  }
  
  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #4a6cfa;
  }
`;

const SaveButton = styled.button`
  background: #4a6cfa;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease;
  
  &:hover {
    background: #3a5cf8;
  }
  
  &:disabled {
    background: #c5c5c5;
    cursor: not-allowed;
  }
`;

const AccessibilitySettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const [settings, setSettings] = useState({
    theme: user?.preferences?.theme || 'light',
    fontSize: user?.preferences?.fontSize || 'medium',
    reducedMotion: user?.preferences?.reducedMotion || false,
    screenReaderOptimized: user?.preferences?.screenReaderOptimized || false,
    readingLevel: user?.preferences?.readingLevel || 'intermediate',
    preferredInputMethod: user?.preferences?.preferredInputMethod || 'standard',
  });
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(updateUserPreferences(settings)).unwrap();
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsContainer>
      <SettingGroup>
        <SettingTitle>Visual Settings</SettingTitle>
        
        <SettingRow>
          <SettingLabel>
            Theme
          </SettingLabel>
          <Select
            value={settings.theme}
            onChange={(e) => handleSettingChange('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="high-contrast">High Contrast</option>
          </Select>
        </SettingRow>
        
        <SettingRow>
          <SettingLabel>
            Font Size
          </SettingLabel>
          <Select
            value={settings.fontSize}
            onChange={(e) => handleSettingChange('fontSize', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="x-large">Extra Large</option>
          </Select>
        </SettingRow>
        
        <SettingRow>
          <SettingLabel>
            Reduce Motion
          </SettingLabel>
          <Toggle>
            <ToggleInput
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
            />
            <ToggleSlider />
          </Toggle>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <SettingTitle>Reading & Comprehension</SettingTitle>
        
        <SettingRow>
          <SettingLabel>
            Reading Level
          </SettingLabel>
          <Select
            value={settings.readingLevel}
            onChange={(e) => handleSettingChange('readingLevel', e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </SettingRow>
        
        <SettingRow>
          <SettingLabel>
            Screen Reader Optimized
          </SettingLabel>
          <Toggle>
            <ToggleInput
              type="checkbox"
              checked={settings.screenReaderOptimized}
              onChange={(e) => handleSettingChange('screenReaderOptimized', e.target.checked)}
            />
            <ToggleSlider />
          </Toggle>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <SettingTitle>Interaction</SettingTitle>
        
        <SettingRow>
          <SettingLabel>
            Preferred Input Method
          </SettingLabel>
          <Select
            value={settings.preferredInputMethod}
            onChange={(e) => handleSettingChange('preferredInputMethod', e.target.value)}
          >
            <option value="standard">Standard</option>
            <option value="voice">Voice</option>
            <option value="switch">Switch</option>
            <option value="eye-tracking">Eye Tracking</option>
          </Select>
        </SettingRow>
      </SettingGroup>

      <SaveButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </SaveButton>
    </SettingsContainer>
  );
};

export default AccessibilitySettings; 