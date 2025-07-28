import React from 'react';
import styled from 'styled-components';

interface Module {
  id: string;
  title: string;
  description: string;
  completion: number;
  timeSpent?: number;
  hasAssessment?: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  progress: number;
  imageUrl?: string;
  modules: Module[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  overallCompletion: number;
  totalTimeSpent: number;
}

interface ProgressOverviewProps {
  path: LearningPath;
}

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
`;

const Title = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 1.5rem 0;
  text-align: center;
`;

const ProgressCircle = styled.div<{ progress: number }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    #4a6cfa ${props => props.progress * 3.6}deg,
    #e0e0e0 ${props => props.progress * 3.6}deg 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 80px;
    height: 80px;
    background: white;
    border-radius: 50%;
  }
`;

const ProgressInner = styled.div`
  position: relative;
  z-index: 1;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
`;

const ModuleProgress = styled.div`
  margin-top: 1.5rem;
`;

const ModuleProgressTitle = styled.h4`
  font-size: 1rem;
  color: #333;
  margin: 0 0 1rem 0;
`;

const ModuleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ModuleName = styled.span`
  font-size: 0.9rem;
  color: #333;
  flex: 1;
`;

const ModuleCompletion = styled.span`
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
`;

const ProgressOverview: React.FC<ProgressOverviewProps> = ({ path }) => {
  const totalModules = path.modules.length;
  const completedModules = path.modules.filter(m => m.completion === 100).length;
  const totalTimeSpent = path.modules.reduce((total, m) => total + (m.timeSpent || 0), 0);
  const estimatedTotalTime = path.modules.reduce((total, m) => total + m.estimatedDuration, 0);

  return (
    <Container>
      <Title>Progress Overview</Title>
      
      <ProgressCircle progress={path.overallCompletion}>
        <ProgressInner>{Math.round(path.overallCompletion)}%</ProgressInner>
      </ProgressCircle>
      
      <StatsGrid>
        <StatItem>
          <StatLabel>Modules</StatLabel>
          <StatValue>{completedModules}/{totalModules}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Time Spent</StatLabel>
          <StatValue>{Math.round(totalTimeSpent / 60)}m</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Est. Time</StatLabel>
          <StatValue>{estimatedTotalTime}m</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Completion</StatLabel>
          <StatValue>{Math.round(path.overallCompletion)}%</StatValue>
        </StatItem>
      </StatsGrid>
      
      <ModuleProgress>
        <ModuleProgressTitle>Module Progress</ModuleProgressTitle>
        {path.modules.map((module) => (
          <ModuleItem key={module.id}>
            <ModuleName>{module.title}</ModuleName>
            <ModuleCompletion>{module.completion}%</ModuleCompletion>
          </ModuleItem>
        ))}
      </ModuleProgress>
    </Container>
  );
};

export default ProgressOverview; 