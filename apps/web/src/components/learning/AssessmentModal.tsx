import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface Question {
  id: string;
  prompt: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correctAnswer: string;
  points: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit?: number;
  passingScore: number;
}

interface AssessmentModalProps {
  moduleId: string;
  onComplete: (moduleId: string, score: number) => void;
  onClose: () => void;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: #4a6cfa;
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const QuestionContainer = styled.div`
  margin-bottom: 2rem;
`;

const QuestionNumber = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const QuestionText = styled.h3`
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.4;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Option = styled.label<{ selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid ${props => props.selected ? '#4a6cfa' : '#e0e0e0'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.selected ? '#f0f4ff' : 'white'};
  
  &:hover {
    border-color: #4a6cfa;
    background: #f0f4ff;
  }
`;

const RadioInput = styled.input`
  margin-right: 0.75rem;
`;

const TextInput = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #4a6cfa;
  }
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
`;

const Button = styled.button<{ primary?: boolean; disabled?: boolean }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.primary ? '#4a6cfa' : '#e0e0e0'};
  background: ${props => props.primary ? '#4a6cfa' : 'white'};
  color: ${props => props.primary ? 'white' : '#333'};
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.primary ? '#3a5cf8' : '#f8f9fa'};
  }
  
  &:disabled {
    opacity: 0.5;
  }
`;

const Timer = styled.div<{ warning: boolean }>`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.warning ? '#e74c3c' : '#333'};
  text-align: center;
  margin-bottom: 1rem;
`;

const AssessmentModal: React.FC<AssessmentModalProps> = ({ moduleId, onComplete, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock assessment data
  useEffect(() => {
    // Simulate loading assessment
    setTimeout(() => {
      setAssessment({
        id: 'assessment-1',
        title: 'Module Assessment',
        description: 'Test your knowledge of the module content',
        questions: [
          {
            id: 'q1',
            prompt: 'What is the primary goal of this module?',
            type: 'multiple_choice',
            options: ['To learn basic concepts', 'To master advanced techniques', 'To understand fundamentals', 'To complete the course'],
            correctAnswer: 'To understand fundamentals',
            points: 10
          },
          {
            id: 'q2',
            prompt: 'True or False: This concept is essential for understanding the next module.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            points: 5
          },
          {
            id: 'q3',
            prompt: 'Explain in your own words the key concept covered in this module.',
            type: 'text',
            correctAnswer: '',
            points: 15
          }
        ],
        timeLimit: 300,
        passingScore: 70
      });
      setLoading(false);
    }, 1000);
  }, [moduleId]);

  useEffect(() => {
    if (assessment?.timeLimit) {
      setTimeLeft(assessment.timeLimit);
    }
  }, [assessment]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!assessment) return;

    let totalScore = 0;
    let maxScore = 0;

    assessment.questions.forEach(question => {
      maxScore += question.points;
      const userAnswer = answers[question.id];
      
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        if (userAnswer === question.correctAnswer) {
          totalScore += question.points;
        }
      } else if (question.type === 'text') {
        // Simple text scoring (in real app, would use AI/ML)
        if (userAnswer && userAnswer.length > 10) {
          totalScore += question.points * 0.8; // 80% for reasonable answer
        }
      }
    });

    const percentage = (totalScore / maxScore) * 100;
    onComplete(moduleId, percentage);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ModalOverlay>
        <Modal>
          <div>Loading assessment...</div>
        </Modal>
      </ModalOverlay>
    );
  }

  if (!assessment) {
    return null;
  }

  const currentQ = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestion === assessment.questions.length - 1;

  return (
    <ModalOverlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>{assessment.title}</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>

        <Description>{assessment.description}</Description>

        <Timer warning={timeLeft < 60}>
          Time Remaining: {formatTime(timeLeft)}
        </Timer>

        <ProgressBar>
          <ProgressFill progress={progress} />
        </ProgressBar>

        <QuestionContainer>
          <QuestionNumber>
            Question {currentQuestion + 1} of {assessment.questions.length}
          </QuestionNumber>
          
          <QuestionText>{currentQ.prompt}</QuestionText>

          {currentQ.type === 'multiple_choice' || currentQ.type === 'true_false' ? (
            <OptionsContainer>
              {currentQ.options?.map((option, index) => (
                <Option
                  key={index}
                  selected={answers[currentQ.id] === option}
                >
                  <RadioInput
                    type="radio"
                    name={currentQ.id}
                    value={option}
                    checked={answers[currentQ.id] === option}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  />
                  {option}
                </Option>
              ))}
            </OptionsContainer>
          ) : (
            <TextInput
              placeholder="Type your answer here..."
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
            />
          )}
        </QuestionContainer>

        <NavigationButtons>
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          {isLastQuestion ? (
            <Button primary onClick={handleSubmit}>
              Submit Assessment
            </Button>
          ) : (
            <Button primary onClick={handleNext}>
              Next
            </Button>
          )}
        </NavigationButtons>
      </Modal>
    </ModalOverlay>
  );
};

export default AssessmentModal; 