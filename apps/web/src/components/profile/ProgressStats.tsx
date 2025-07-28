import React from 'react';
import styled from 'styled-components';

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4a6cfa;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: #4a6cfa;
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const RecentActivity = styled.div`
  margin-top: 1.5rem;
`;

const ActivityTitle = styled.h4`
  font-size: 1rem;
  color: #333;
  margin: 0 0 1rem 0;
`;

const ActivityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityText = styled.span`
  font-size: 0.9rem;
  color: #333;
`;

const ActivityTime = styled.span`
  font-size: 0.8rem;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 2rem 0;
`;

const ProgressStats: React.FC = () => {
  // Mock data - in real app, this would come from Redux store
  const stats = {
    totalPaths: 12,
    completedPaths: 8,
    totalTimeSpent: 45, // hours
    currentStreak: 7, // days
    averageScore: 87, // percentage
    totalAchievements: 15
  };

  const recentActivity = [
    { text: 'Completed "Web Development Fundamentals"', time: '2 hours ago' },
    { text: 'Earned "Consistency Champion" badge', time: '1 day ago' },
    { text: 'Started "Data Science Essentials"', time: '3 days ago' },
    { text: 'Achieved 90% on Module Assessment', time: '1 week ago' }
  ];

  const overallProgress = (stats.completedPaths / stats.totalPaths) * 100;

  return (
    <div>
      <StatsContainer>
        <StatCard>
          <StatValue>{stats.completedPaths}/{stats.totalPaths}</StatValue>
          <StatLabel>Learning Paths</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.totalTimeSpent}h</StatValue>
          <StatLabel>Time Spent</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.currentStreak}</StatValue>
          <StatLabel>Day Streak</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.averageScore}%</StatValue>
          <StatLabel>Avg Score</StatLabel>
        </StatCard>
      </StatsContainer>

      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#333' }}>Overall Progress</span>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>{Math.round(overallProgress)}%</span>
        </div>
        <ProgressBar>
          <ProgressFill progress={overallProgress} />
        </ProgressBar>
      </div>

      <RecentActivity>
        <ActivityTitle>Recent Activity</ActivityTitle>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity, index) => (
            <ActivityItem key={index}>
              <ActivityText>{activity.text}</ActivityText>
              <ActivityTime>{activity.time}</ActivityTime>
            </ActivityItem>
          ))
        ) : (
          <EmptyState>
            No recent activity to display
          </EmptyState>
        )}
      </RecentActivity>
    </div>
  );
};

export default ProgressStats; 