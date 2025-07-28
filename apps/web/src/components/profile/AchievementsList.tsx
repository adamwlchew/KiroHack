import React from 'react';
import styled from 'styled-components';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'learning' | 'consistency' | 'mastery' | 'social';
}

const AchievementsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AchievementCard = styled.div<{ earned: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid ${props => props.earned ? '#e8f5e8' : '#f0f0f0'};
  border-radius: 8px;
  background: ${props => props.earned ? '#f8fff8' : '#fafafa'};
  opacity: ${props => props.earned ? 1 : 0.6};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const AchievementIcon = styled.div<{ rarity: string; earned: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: ${props => {
    if (!props.earned) return '#e0e0e0';
    switch(props.rarity) {
      case 'common': return '#e8f5e8';
      case 'rare': return '#e3f2fd';
      case 'epic': return '#f3e5f5';
      case 'legendary': return '#fff3e0';
      default: return '#e8f5e8';
    }
  }};
  color: ${props => {
    if (!props.earned) return '#999';
    switch(props.rarity) {
      case 'common': return '#2e7d32';
      case 'rare': return '#1976d2';
      case 'epic': return '#8e24aa';
      case 'legendary': return '#f57c00';
      default: return '#2e7d32';
    }
  }};
  border: 2px solid ${props => {
    if (!props.earned) return '#e0e0e0';
    switch(props.rarity) {
      case 'common': return '#4caf50';
      case 'rare': return '#2196f3';
      case 'epic': return '#9c27b0';
      case 'legendary': return '#ff9800';
      default: return '#4caf50';
    }
  }};
`;

const AchievementInfo = styled.div`
  flex: 1;
`;

const AchievementTitle = styled.h4<{ earned: boolean }>`
  font-size: 1rem;
  color: ${props => props.earned ? '#333' : '#999'};
  margin: 0 0 0.25rem 0;
  font-weight: 600;
`;

const AchievementDescription = styled.p<{ earned: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.earned ? '#666' : '#ccc'};
  margin: 0;
  line-height: 1.3;
`;

const AchievementMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const RarityBadge = styled.span<{ rarity: string }>`
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  text-transform: uppercase;
  background: ${props => {
    switch(props.rarity) {
      case 'common': return '#e8f5e8';
      case 'rare': return '#e3f2fd';
      case 'epic': return '#f3e5f5';
      case 'legendary': return '#fff3e0';
      default: return '#e8f5e8';
    }
  }};
  color: ${props => {
    switch(props.rarity) {
      case 'common': return '#2e7d32';
      case 'rare': return '#1976d2';
      case 'epic': return '#8e24aa';
      case 'legendary': return '#f57c00';
      default: return '#2e7d32';
    }
  }};
`;

const EarnedDate = styled.span`
  font-size: 0.7rem;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 2rem 0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.active ? '#4a6cfa' : '#e0e0e0'};
  background: ${props => props.active ? '#4a6cfa' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #4a6cfa;
    background: ${props => props.active ? '#3a5cf8' : '#f0f4ff'};
  }
`;

const AchievementsList: React.FC = () => {
  const [filter, setFilter] = React.useState<'all' | 'learning' | 'consistency' | 'mastery' | 'social'>('all');

  // Mock achievements data
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first learning module',
      icon: '🎯',
      earnedAt: '2024-01-15',
      rarity: 'common',
      category: 'learning'
    },
    {
      id: '2',
      title: 'Consistency Champion',
      description: 'Maintain a 7-day learning streak',
      icon: '🔥',
      earnedAt: '2024-01-20',
      rarity: 'rare',
      category: 'consistency'
    },
    {
      id: '3',
      title: 'Module Master',
      description: 'Achieve 100% on a module assessment',
      icon: '🏆',
      earnedAt: '2024-01-25',
      rarity: 'epic',
      category: 'mastery'
    },
    {
      id: '4',
      title: 'Path Pioneer',
      description: 'Complete an entire learning path',
      icon: '🚀',
      earnedAt: '',
      rarity: 'legendary',
      category: 'learning'
    },
    {
      id: '5',
      title: 'Study Buddy',
      description: 'Help another learner with a question',
      icon: '🤝',
      earnedAt: '',
      rarity: 'common',
      category: 'social'
    }
  ];

  const filteredAchievements = filter === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === filter);

  const earnedAchievements = achievements.filter(a => a.earnedAt);
  const totalAchievements = achievements.length;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#333' }}>Progress</span>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>{earnedAchievements.length}/{totalAchievements}</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          background: '#e0e0e0', 
          borderRadius: '4px', 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            height: '100%', 
            width: `${(earnedAchievements.length / totalAchievements) * 100}%`, 
            background: '#4a6cfa', 
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      <FilterContainer>
        <FilterButton 
          active={filter === 'all'} 
          onClick={() => setFilter('all')}
        >
          All
        </FilterButton>
        <FilterButton 
          active={filter === 'learning'} 
          onClick={() => setFilter('learning')}
        >
          Learning
        </FilterButton>
        <FilterButton 
          active={filter === 'consistency'} 
          onClick={() => setFilter('consistency')}
        >
          Consistency
        </FilterButton>
        <FilterButton 
          active={filter === 'mastery'} 
          onClick={() => setFilter('mastery')}
        >
          Mastery
        </FilterButton>
        <FilterButton 
          active={filter === 'social'} 
          onClick={() => setFilter('social')}
        >
          Social
        </FilterButton>
      </FilterContainer>

      <AchievementsContainer>
        {filteredAchievements.length > 0 ? (
          filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} earned={!!achievement.earnedAt}>
              <AchievementIcon rarity={achievement.rarity} earned={!!achievement.earnedAt}>
                {achievement.icon}
              </AchievementIcon>
              
              <AchievementInfo>
                <AchievementTitle earned={!!achievement.earnedAt}>
                  {achievement.title}
                </AchievementTitle>
                <AchievementDescription earned={!!achievement.earnedAt}>
                  {achievement.description}
                </AchievementDescription>
              </AchievementInfo>
              
              <AchievementMeta>
                <RarityBadge rarity={achievement.rarity}>
                  {achievement.rarity}
                </RarityBadge>
                {achievement.earnedAt && (
                  <EarnedDate>
                    {new Date(achievement.earnedAt).toLocaleDateString()}
                  </EarnedDate>
                )}
              </AchievementMeta>
            </AchievementCard>
          ))
        ) : (
          <EmptyState>
            No achievements found for this category
          </EmptyState>
        )}
      </AchievementsContainer>
    </div>
  );
};

export default AchievementsList; 