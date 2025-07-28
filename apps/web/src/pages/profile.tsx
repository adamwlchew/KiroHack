import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserProfile, updateUserPreferences } from '@/store/slices/userSlice';
import PageCompanion from '@/components/companion/PageCompanion';
import AccessibilitySettings from '@/components/profile/AccessibilitySettings';
import ProgressStats from '@/components/profile/ProgressStats';
import AchievementsList from '@/components/profile/AchievementsList';

const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a6cfa, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  font-weight: bold;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const UserEmail = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 1rem 0;
`;

const UserRole = styled.span`
  background: #e8f5e8;
  color: #2e7d32;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
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
`;

const BackButton = styled.button`
  background: none;
  border: 2px solid #4a6cfa;
  color: #4a6cfa;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-bottom: 2rem;
  
  &:hover {
    background: #4a6cfa;
    color: white;
  }
`;

export default function Profile() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  if (loading) {
    return (
      <ProfileContainer>
        <LoadingSpinner>Loading profile...</LoadingSpinner>
      </ProfileContainer>
    );
  }

  if (error || !user) {
    return (
      <ProfileContainer>
        <ErrorMessage>
          {error || 'Failed to load profile'}
        </ErrorMessage>
        <BackButton onClick={() => window.history.back()}>
          ← Go Back
        </BackButton>
      </ProfileContainer>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <Head>
        <title>Profile | PageFlow</title>
        <meta name="description" content="Your PageFlow profile and settings" />
      </Head>

      <ProfileContainer>
        <Header>
          <Avatar>
            {getInitials(user.firstName, user.lastName)}
          </Avatar>
          
          <UserInfo>
            <UserName>{user.firstName} {user.lastName}</UserName>
            <UserEmail>{user.email}</UserEmail>
            <UserRole>{user.role}</UserRole>
          </UserInfo>
        </Header>

        <ContentGrid>
          <Section>
            <SectionTitle>
              📊 Progress Overview
            </SectionTitle>
            <ProgressStats />
          </Section>

          <Section>
            <SectionTitle>
              🏆 Achievements
            </SectionTitle>
            <AchievementsList />
          </Section>

          <Section>
            <SectionTitle>
              ⚙️ Accessibility Settings
            </SectionTitle>
            <AccessibilitySettings />
          </Section>

          <Section>
            <SectionTitle>
              📈 Learning Analytics
            </SectionTitle>
            <div>
              <p>Detailed learning analytics and insights will be displayed here.</p>
              <p>This will include:</p>
              <ul>
                <li>Learning patterns and trends</li>
                <li>Time spent on different topics</li>
                <li>Performance improvements</li>
                <li>Recommended next steps</li>
              </ul>
            </div>
          </Section>
        </ContentGrid>

        <PageCompanion />
      </ProfileContainer>
    </>
  );
} 