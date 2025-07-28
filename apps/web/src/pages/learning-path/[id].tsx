import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchLearningPath, updateProgress } from '@/store/slices/learningSlice';
import PageCompanion from '@/components/companion/PageCompanion';
import ModuleCard from '@/components/learning/ModuleCard';
import ProgressOverview from '@/components/learning/ProgressOverview';
import AssessmentModal from '@/components/learning/AssessmentModal';

const LearningPathContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
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
  margin-bottom: 1rem;
`;

const Stats = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const Stat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4a6cfa;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ModulesSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
`;

const ModulesTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
`;

const ModulesGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  
  &:hover {
    background: #4a6cfa;
    color: white;
  }
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

export default function LearningPathDetail() {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useAppDispatch();
  const { currentPath, loading, error } = useAppSelector((state) => state.learning);
  const [showAssessment, setShowAssessment] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchLearningPath(id));
    }
  }, [id, dispatch]);

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(moduleId);
    // Navigate to module content or open assessment
    if (currentPath?.modules.find(m => m.id === moduleId)?.hasAssessment) {
      setShowAssessment(true);
    } else {
      router.push(`/learning-path/${id}/module/${moduleId}`);
    }
  };

  const handleAssessmentComplete = (moduleId: string, score: number) => {
    dispatch(updateProgress({ pathId: id as string, moduleId, score }));
    setShowAssessment(false);
    setSelectedModule(null);
  };

  if (loading) {
    return (
      <LearningPathContainer>
        <LoadingSpinner>Loading learning path...</LoadingSpinner>
      </LearningPathContainer>
    );
  }

  if (error || !currentPath) {
    return (
      <LearningPathContainer>
        <ErrorMessage>
          {error || 'Failed to load learning path'}
        </ErrorMessage>
        <BackButton onClick={() => router.push('/')}>
          Back to Home
        </BackButton>
      </LearningPathContainer>
    );
  }

  const totalModules = currentPath.modules.length;
  const completedModules = currentPath.modules.filter(m => m.completion === 100).length;
  const totalTimeSpent = currentPath.modules.reduce((total, m) => total + (m.timeSpent || 0), 0);

  return (
    <>
      <Head>
        <title>{currentPath.title} | PageFlow</title>
        <meta name="description" content={currentPath.description} />
      </Head>

      <LearningPathContainer>
        <Header>
          <BackButton onClick={() => router.push('/')}>
            ← Back to Home
          </BackButton>
          
          <Title>{currentPath.title}</Title>
          <Description>{currentPath.description}</Description>
          
          <Stats>
            <Stat>
              <StatValue>{completedModules}/{totalModules}</StatValue>
              <StatLabel>Modules Completed</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{Math.round(currentPath.overallCompletion)}%</StatValue>
              <StatLabel>Overall Progress</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{Math.round(totalTimeSpent / 60)}m</StatValue>
              <StatLabel>Time Spent</StatLabel>
            </Stat>
          </Stats>
        </Header>

        <ContentGrid>
          <ModulesSection>
            <ModulesTitle>Modules</ModulesTitle>
            <ModulesGrid>
              {currentPath.modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onClick={() => handleModuleClick(module.id)}
                />
              ))}
            </ModulesGrid>
          </ModulesSection>

          <Sidebar>
            <ProgressOverview path={currentPath} />
          </Sidebar>
        </ContentGrid>

        <PageCompanion />
      </LearningPathContainer>

      {showAssessment && selectedModule && (
        <AssessmentModal
          moduleId={selectedModule}
          onComplete={handleAssessmentComplete}
          onClose={() => setShowAssessment(false)}
        />
      )}
    </>
  );
} 