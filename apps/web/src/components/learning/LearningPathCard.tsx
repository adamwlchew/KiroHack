import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  progress: number;
  imageUrl?: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  overallCompletion: number;
  totalTimeSpent: number;
}

interface LearningPathCardProps {
  learningPath: LearningPath;
}

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(74, 108, 250, 0.15);
    border-color: #4a6cfa;
  }
`;

const CardImage = styled.div<{ imageUrl?: string }>`
  height: 160px;
  background-image: url(${props => props.imageUrl || '/images/default-path.jpg'});
  background-size: cover;
  background-position: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(74, 108, 250, 0.1), rgba(124, 58, 237, 0.1));
  }
`;

const DifficultyBadge = styled.span<{ difficulty: string }>`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch(props.difficulty) {
      case 'beginner': return '#e8f5e8';
      case 'intermediate': return '#fff3cd';
      case 'advanced': return '#f8d7da';
      case 'expert': return '#e3f2fd';
      default: return '#e0e0e0';
    }
  }};
  color: ${props => {
    switch(props.difficulty) {
      case 'beginner': return '#2e7d32';
      case 'intermediate': return '#856404';
      case 'advanced': return '#721c24';
      case 'expert': return '#1976d2';
      default: return '#666';
    }
  }};
`;

const CardContent = styled.div`
  padding: 20px;
`;

const CardTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
`;

const CardDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.8rem;
  color: #666;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ProgressContainer = styled.div`
  margin-top: 12px;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #4a6cfa, #7c3aed);
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
`;

const LearningPathCard: React.FC<LearningPathCardProps> = ({ learningPath }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/learning-path/${learningPath.id}`);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return formatDuration(minutes);
  };
  
  return (
    <Card onClick={handleClick}>
      <CardImage imageUrl={learningPath.imageUrl}>
        <DifficultyBadge difficulty={learningPath.difficulty}>
          {learningPath.difficulty}
        </DifficultyBadge>
      </CardImage>
      <CardContent>
        <CardTitle>{learningPath.title}</CardTitle>
        <CardDescription>{learningPath.description}</CardDescription>
        
        <StatsContainer>
          <Stat>
            <span>⏱️</span>
            <span>{formatDuration(learningPath.estimatedDuration)}</span>
          </Stat>
          <Stat>
            <span>📊</span>
            <span>{learningPath.overallCompletion}% complete</span>
          </Stat>
        </StatsContainer>
        
        <ProgressContainer>
          <ProgressBar>
            <ProgressFill progress={learningPath.overallCompletion} />
          </ProgressBar>
          <ProgressText>
            <span>Progress</span>
            <span>{learningPath.overallCompletion}%</span>
          </ProgressText>
        </ProgressContainer>
      </CardContent>
    </Card>
  );
};

export default LearningPathCard;