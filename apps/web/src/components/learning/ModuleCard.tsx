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

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
}

const Card = styled.div`
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #4a6cfa;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(74, 108, 250, 0.1);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
`;

const Badge = styled.span<{ difficulty: string }>`
  background: ${props => {
    switch(props.difficulty) {
      case 'beginner': return '#e8f5e8';
      case 'intermediate': return '#fff3cd';
      case 'advanced': return '#f8d7da';
      default: return '#e0e0e0';
    }
  }};
  color: ${props => {
    switch(props.difficulty) {
      case 'beginner': return '#2e7d32';
      case 'intermediate': return '#856404';
      case 'advanced': return '#721c24';
      default: return '#666';
    }
  }};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 1rem;
`;

const Description = styled.p`
  color: #666;
  line-height: 1.5;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const ProgressContainer = styled.div`
  margin-bottom: 1rem;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: #4a6cfa;
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
`;

const TimeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AssessmentBadge = styled.span`
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onClick }) => {
  return (
    <Card onClick={onClick}>
      <Header>
        <Title>{module.title}</Title>
        <Badge difficulty={module.difficulty}>
          {module.difficulty}
        </Badge>
      </Header>
      
      <Description>{module.description}</Description>
      
      <ProgressContainer>
        <ProgressBar>
          <ProgressFill progress={module.completion} />
        </ProgressBar>
        <ProgressText>
          <span>Progress</span>
          <span>{module.completion}%</span>
        </ProgressText>
      </ProgressContainer>
      
      <Footer>
        <TimeInfo>
          <span>⏱️</span>
          <span>
            {module.timeSpent ? `${Math.round(module.timeSpent / 60)}m spent` : `${module.estimatedDuration}m estimated`}
          </span>
        </TimeInfo>
        
        {module.hasAssessment && (
          <AssessmentBadge>Assessment</AssessmentBadge>
        )}
      </Footer>
    </Card>
  );
};

export default ModuleCard; 