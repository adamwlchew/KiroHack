import Head from 'next/head';
import styled from 'styled-components';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchUserProfile } from '@/store/slices/userSlice';
import { fetchLearningPaths } from '@/store/slices/learningSlice';
import PageCompanion from '@/components/companion/PageCompanion';
import LearningPathCard from '@/components/learning/LearningPathCard';

const HomeContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeSection = styled.section`
  margin-bottom: 3rem;
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #4a6cfa, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const WelcomeMessage = styled.p`
  font-size: 1.2rem;
  color: #666;
  line-height: 1.6;
`;

const LoadingMessage = styled.p`
  font-size: 1.1rem;
  color: #999;
  font-style: italic;
`;

const LearningPathsSection = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LearningPathGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const LoadingCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-style: italic;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const EmptyStateMessage = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
`;

const GetStartedButton = styled.button`
  background: linear-gradient(135deg, #4a6cfa, #7c3aed);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

export default function Home() {
  const dispatch = useAppDispatch();
  const { user, loading: userLoading } = useAppSelector((state) => state.user);
  const { paths, loading: pathsLoading } = useAppSelector((state) => state.learning);

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchLearningPaths());
  }, [dispatch]);

  const isLoading = userLoading || pathsLoading;

  return (
    <>
      <Head>
        <title>PageFlow | Home</title>
        <meta name="description" content="PageFlow AI Learning Platform - Personalized AI-powered learning experiences" />
        <meta name="keywords" content="AI learning, personalized education, adaptive learning, PageFlow" />
      </Head>

      <HomeContainer>
        <WelcomeSection>
          <WelcomeTitle>Welcome to PageFlow</WelcomeTitle>
          {userLoading ? (
            <LoadingMessage>Loading your profile...</LoadingMessage>
          ) : (
            <WelcomeMessage>
              Hello, <strong>{user?.firstName || 'Learner'}</strong>! Ready to continue your learning journey?
            </WelcomeMessage>
          )}
        </WelcomeSection>

        <LearningPathsSection>
          <SectionTitle>
            📚 Your Learning Paths
          </SectionTitle>
          
          {pathsLoading ? (
            <LoadingGrid>
              {[1, 2, 3].map((i) => (
                <LoadingCard key={i}>
                  Loading learning path...
                </LoadingCard>
              ))}
            </LoadingGrid>
          ) : paths.length > 0 ? (
            <LearningPathGrid>
              {paths.map((path) => (
                <LearningPathCard key={path.id} learningPath={path} />
              ))}
            </LearningPathGrid>
          ) : (
            <EmptyState>
              <EmptyStateIcon>📚</EmptyStateIcon>
              <EmptyStateTitle>No Learning Paths Yet</EmptyStateTitle>
              <EmptyStateMessage>
                Start your learning journey by exploring our available courses and learning paths.
              </EmptyStateMessage>
              <GetStartedButton>
                Explore Learning Paths
              </GetStartedButton>
            </EmptyState>
          )}
        </LearningPathsSection>

        <PageCompanion />
      </HomeContainer>
    </>
  );
}