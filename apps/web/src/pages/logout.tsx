import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { useAppDispatch } from '@/hooks/redux';
import { logout } from '@/store/slices/userSlice';

const LogoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
`;

const LogoutMessage = styled.div`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a6cfa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function Logout() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    // Dispatch logout action
    dispatch(logout());
    
    // Redirect to home page after a short delay
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [dispatch, router]);

  return (
    <LogoutContainer>
      <Spinner />
      <LogoutMessage>
        Logging you out...
      </LogoutMessage>
    </LogoutContainer>
  );
} 