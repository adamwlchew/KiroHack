import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchCompanion, interactWithCompanion, toggleCompanionVisibility } from '@/store/slices/companionSlice';
import { Emotion } from '@pageflow/types';

// Styled components for the Page companion
const CompanionContainer = styled.div<{ isVisible: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform: ${props => props.isVisible ? 'translateY(0)' : 'translateY(100%)'};
  opacity: ${props => props.isVisible ? 1 : 0};
  z-index: 1000;
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const CompanionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #4a6cfa;
  color: white;
`;

const CompanionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
`;

const CompanionControls = styled.div`
  display: flex;
  gap: 8px;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const CompanionBody = styled.div`
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
`;

const CompanionAvatar = styled.div<{ emotion: Emotion }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 12px;
  
  /* Different colors based on emotion */
  ${props => {
    switch(props.emotion) {
      case 'HAPPY':
        return 'background-color: #e0f7fa; color: #00acc1;';
      case 'EXCITED':
        return 'background-color: #fff8e1; color: #ffb300;';
      case 'THOUGHTFUL':
        return 'background-color: #e8f5e9; color: #43a047;';
      case 'CONCERNED':
        return 'background-color: #ffebee; color: #e53935;';
      case 'SURPRISED':
        return 'background-color: #f3e5f5; color: #8e24aa;';
      default:
        return 'background-color: #e0e7ff; color: #3949ab;';
    }
  }}
`;

const Message = styled.div<{ isUser?: boolean }>`
  background-color: ${props => props.isUser ? '#e9f3ff' : '#f5f5f5'};
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 8px;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  max-width: 80%;
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid #eaeaea;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 20px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #4a6cfa;
  }
`;

const SendButton = styled.button`
  background-color: #4a6cfa;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #3a5cf8;
  }
  
  &:disabled {
    background-color: #c5c5c5;
    cursor: not-allowed;
  }
`;

const PageCompanion: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companion, isVisible, loading, interactionInProgress } = useAppSelector(state => state.companion);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    dispatch(fetchCompanion());
  }, [dispatch]);
  
  const handleSendMessage = () => {
    if (input.trim()) {
      dispatch(interactWithCompanion(input));
      setInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  if (loading || !companion) {
    return (
      <CompanionContainer isVisible={isVisible}>
        <CompanionHeader>
          <CompanionTitle>Page</CompanionTitle>
          <CompanionControls>
            <ControlButton onClick={() => dispatch(toggleCompanionVisibility())}>
              {isVisible ? '−' : '+'}
            </ControlButton>
          </CompanionControls>
        </CompanionHeader>
        <CompanionBody>
          <p>Loading your companion...</p>
        </CompanionBody>
      </CompanionContainer>
    );
  }
  
  return (
    <CompanionContainer 
      isVisible={isVisible}
      role="complementary"
      aria-label="Page AI Learning Companion"
    >
      <CompanionHeader>
        <CompanionTitle>Page</CompanionTitle>
        <CompanionControls>
          <ControlButton 
            onClick={() => dispatch(toggleCompanionVisibility())}
            aria-label={isVisible ? 'Minimize companion' : 'Expand companion'}
            aria-expanded={isVisible}
          >
            {isVisible ? '−' : '+'}
          </ControlButton>
        </CompanionControls>
      </CompanionHeader>
      <CompanionBody>
        <CompanionAvatar 
          emotion={companion.emotionalState.primary}
          role="img"
          aria-label={`Page is feeling ${companion.emotionalState.primary.toLowerCase()}`}
        >
          😊
        </CompanionAvatar>
        
        <MessageContainer>
          {companion.interactionHistory.length === 0 ? (
            <Message>
              Hi there! I'm Page, your learning companion. How can I help you today?
            </Message>
          ) : (
            companion.interactionHistory.slice(-5).map((interaction) => (
              <React.Fragment key={interaction.id}>
                <Message isUser>{interaction.userInput}</Message>
                <Message>{interaction.companionResponse}</Message>
              </React.Fragment>
            ))
          )}
          
          {interactionInProgress && (
            <Message>Thinking...</Message>
          )}
        </MessageContainer>
      </CompanionBody>
      
      <InputContainer>
        <Input
          type="text"
          placeholder="Ask Page a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={interactionInProgress}
          aria-label="Message input for Page companion"
        />
        <SendButton 
          onClick={handleSendMessage}
          disabled={!input.trim() || interactionInProgress}
          aria-label="Send message to Page"
        >
          Send
        </SendButton>
      </InputContainer>
    </CompanionContainer>
  );
};

export default PageCompanion;