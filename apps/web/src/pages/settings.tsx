import React from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserProfile } from '@/store/slices/userSlice';
import AccessibilitySettings from '@/components/profile/AccessibilitySettings';

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
`;

const SettingsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #fcc;
  margin-bottom: 2rem;
`;

const AccountInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const InfoItem = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const DangerZone = styled.div`
  border: 2px solid #fee;
  border-radius: 12px;
  padding: 2rem;
  background: #fff;
`;

const DangerButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #c82333;
  }
`;

export default function Settings() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.user);

  React.useEffect(() => {
    if (!user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, user]);

  if (loading) {
    return (
      <SettingsContainer>
        <LoadingSpinner>Loading settings...</LoadingSpinner>
      </SettingsContainer>
    );
  }

  if (error || !user) {
    return (
      <SettingsContainer>
        <ErrorMessage>
          {error || 'Failed to load user settings'}
        </ErrorMessage>
      </SettingsContainer>
    );
  }

  return (
    <>
      <Head>
        <title>Settings | PageFlow</title>
        <meta name="description" content="Manage your PageFlow account settings and preferences" />
      </Head>

      <SettingsContainer>
        <Header>
          <Title>Settings</Title>
          <Description>
            Manage your account settings, preferences, and privacy options.
          </Description>
        </Header>

        <SettingsSection>
          <SectionTitle>
            👤 Account Information
          </SectionTitle>
          <AccountInfo>
            <InfoItem>
              <InfoLabel>Name</InfoLabel>
              <InfoValue>{user.firstName} {user.lastName}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>{user.email}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Role</InfoLabel>
              <InfoValue>{user.role}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Member Since</InfoLabel>
              <InfoValue>
                {new Date(user.createdAt).toLocaleDateString()}
              </InfoValue>
            </InfoItem>
          </AccountInfo>
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>
            ♿ Accessibility Settings
          </SectionTitle>
          <AccessibilitySettings />
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>
            🔔 Notifications
          </SectionTitle>
          <p>Notification settings will be available here.</p>
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>
            🔒 Privacy & Security
          </SectionTitle>
          <p>Privacy and security settings will be available here.</p>
        </SettingsSection>

        <DangerZone>
          <SectionTitle>
            ⚠️ Danger Zone
          </SectionTitle>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            These actions cannot be undone. Please proceed with caution.
          </p>
          <DangerButton>
            Delete Account
          </DangerButton>
        </DangerZone>
      </SettingsContainer>
    </>
  );
} 