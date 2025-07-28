import { PersonalityTrait } from '@pageflow/types';

/**
 * Personality trait configuration with weights and behaviors
 */
export interface PersonalityTraitConfig {
  trait: PersonalityTrait;
  weight: number; // 0-100, how strongly this trait influences behavior
  responseModifiers: ResponseModifier[];
  emotionalTriggers: EmotionalTrigger[];
}

/**
 * Response modifiers based on personality traits
 */
export interface ResponseModifier {
  condition: string; // Context condition
  modification: {
    tone?: 'formal' | 'casual' | 'enthusiastic' | 'calm';
    verbosity?: 'brief' | 'moderate' | 'detailed';
    encouragement?: 'low' | 'medium' | 'high';
    examples?: boolean;
  };
}

/**
 * Emotional triggers based on personality traits
 */
export interface EmotionalTrigger {
  userBehavior: string; // e.g., "struggling", "succeeding", "asking_for_help"
  emotionalResponse: {
    emotion: string;
    intensityModifier: number; // -50 to +50
  };
}

/**
 * Default personality trait configurations
 */
export const DEFAULT_PERSONALITY_CONFIGS: Record<PersonalityTrait, PersonalityTraitConfig> = {
  [PersonalityTrait.ENCOURAGING]: {
    trait: PersonalityTrait.ENCOURAGING,
    weight: 80,
    responseModifiers: [
      {
        condition: 'user_struggling',
        modification: {
          tone: 'enthusiastic',
          encouragement: 'high',
          examples: true
        }
      },
      {
        condition: 'user_succeeding',
        modification: {
          tone: 'enthusiastic',
          encouragement: 'high',
          verbosity: 'moderate'
        }
      }
    ],
    emotionalTriggers: [
      {
        userBehavior: 'struggling',
        emotionalResponse: {
          emotion: 'CONCERNED',
          intensityModifier: 20
        }
      },
      {
        userBehavior: 'succeeding',
        emotionalResponse: {
          emotion: 'EXCITED',
          intensityModifier: 30
        }
      }
    ]
  },

  [PersonalityTrait.PATIENT]: {
    trait: PersonalityTrait.PATIENT,
    weight: 70,
    responseModifiers: [
      {
        condition: 'user_confused',
        modification: {
          tone: 'calm',
          verbosity: 'detailed',
          encouragement: 'medium'
        }
      },
      {
        condition: 'repeated_question',
        modification: {
          tone: 'calm',
          verbosity: 'detailed',
          examples: true
        }
      }
    ],
    emotionalTriggers: [
      {
        userBehavior: 'repeated_mistakes',
        emotionalResponse: {
          emotion: 'THOUGHTFUL',
          intensityModifier: 10
        }
      }
    ]
  },

  [PersonalityTrait.ENTHUSIASTIC]: {
    trait: PersonalityTrait.ENTHUSIASTIC,
    weight: 85,
    responseModifiers: [
      {
        condition: 'new_topic',
        modification: {
          tone: 'enthusiastic',
          verbosity: 'moderate',
          encouragement: 'high'
        }
      },
      {
        condition: 'milestone_reached',
        modification: {
          tone: 'enthusiastic',
          verbosity: 'moderate',
          encouragement: 'high'
        }
      }
    ],
    emotionalTriggers: [
      {
        userBehavior: 'starting_new_content',
        emotionalResponse: {
          emotion: 'EXCITED',
          intensityModifier: 25
        }
      },
      {
        userBehavior: 'completing_challenge',
        emotionalResponse: {
          emotion: 'HAPPY',
          intensityModifier: 35
        }
      }
    ]
  },

  [PersonalityTrait.CALM]: {
    trait: PersonalityTrait.CALM,
    weight: 60,
    responseModifiers: [
      {
        condition: 'user_frustrated',
        modification: {
          tone: 'calm',
          verbosity: 'brief',
          encouragement: 'medium'
        }
      },
      {
        condition: 'high_stress_situation',
        modification: {
          tone: 'calm',
          verbosity: 'moderate',
          encouragement: 'low'
        }
      }
    ],
    emotionalTriggers: [
      {
        userBehavior: 'showing_frustration',
        emotionalResponse: {
          emotion: 'NEUTRAL',
          intensityModifier: -10
        }
      }
    ]
  },

  [PersonalityTrait.TECHNICAL]: {
    trait: PersonalityTrait.TECHNICAL,
    weight: 75,
    responseModifiers: [
      {
        condition: 'technical_question',
        modification: {
          tone: 'formal',
          verbosity: 'detailed',
          examples: true
        }
      },
      {
        condition: 'explaining_concept',
        modification: {
          tone: 'formal',
          verbosity: 'detailed',
          encouragement: 'low'
        }
      }
    ],
    emotionalTriggers: [
      {
        userBehavior: 'asking_technical_question',
        emotionalResponse: {
          emotion: 'THOUGHTFUL',
          intensityModifier: 15
        }
      }
    ]
  },

  [PersonalityTrait.FRIENDLY]: {
    trait: PersonalityTrait.FRIENDLY,
    weight: 90,
    responseModifiers: [
      {
        condition: 'greeting',
        modification: {
          tone: 'casual',
          verbosity: 'moderate',
          encouragement: 'medium'
        }
      },
      {
        condition: 'casual_conversation',
        modification: {
          tone: 'casual',
          verbosity: 'moderate',
          encouragement: 'medium'
        }
      }
    ],
    emotionalTriggers: [
      {
        userBehavior: 'greeting',
        emotionalResponse: {
          emotion: 'HAPPY',
          intensityModifier: 20
        }
      },
      {
        userBehavior: 'sharing_personal_info',
        emotionalResponse: {
          emotion: 'HAPPY',
          intensityModifier: 15
        }
      }
    ]
  },

  [PersonalityTrait.HUMOROUS]: {
    trait: PersonalityTrait.HUMOROUS,
    weight: 65,
    responseModifiers: [
      {
        condition: 'light_moment',
        modification: {
          tone: 'casual',
          verbosity: 'moderate',
          encouragement: 'medium'
        }
      },
      {
        condition: 'user_making_joke',
        modification: {
          tone: 'casual',
          verbosity: 'brief',
          encouragement: 'medium'
        }
      }
    ],
    emotionalTriggers: [
      {
        userBehavior: 'making_joke',
        emotionalResponse: {
          emotion: 'HAPPY',
          intensityModifier: 25
        }
      },
      {
        userBehavior: 'light_hearted_interaction',
        emotionalResponse: {
          emotion: 'EXCITED',
          intensityModifier: 20
        }
      }
    ]
  },

  [PersonalityTrait.SERIOUS]: {
    trait: PersonalityTrait.SERIOUS,
    weight: 55,
    responseModifiers: [
      {
        condition: 'important_topic',
        modification: {
          tone: 'formal',
          verbosity: 'detailed',
          encouragement: 'low'
        }
      },
      {
        condition: 'assessment_time',
        modification: {
          tone: 'formal',
          verbosity: 'brief',
          encouragement: 'low'
        }
      }
    ],
    emotionalTriggers: [
      {
        userBehavior: 'taking_assessment',
        emotionalResponse: {
          emotion: 'THOUGHTFUL',
          intensityModifier: 10
        }
      },
      {
        userBehavior: 'discussing_important_topic',
        emotionalResponse: {
          emotion: 'NEUTRAL',
          intensityModifier: 5
        }
      }
    ]
  }
};

/**
 * Calculate combined personality influence on response
 */
export function calculatePersonalityInfluence(
  traits: PersonalityTrait[],
  context: string
): {
  tone: string;
  verbosity: string;
  encouragement: string;
  examples: boolean;
} {
  const configs = traits.map(trait => DEFAULT_PERSONALITY_CONFIGS[trait]);
  const relevantModifiers = configs
    .flatMap(config => config.responseModifiers)
    .filter(modifier => context.includes(modifier.condition));

  // Default values
  let result = {
    tone: 'casual',
    verbosity: 'moderate',
    encouragement: 'medium',
    examples: false
  };

  // Apply modifiers based on trait weights
  relevantModifiers.forEach(modifier => {
    const config = configs.find(c => 
      c.responseModifiers.includes(modifier)
    );
    
    if (config && modifier.modification) {
      const weight = config.weight / 100;
      
      if (modifier.modification.tone) {
        result.tone = modifier.modification.tone;
      }
      if (modifier.modification.verbosity) {
        result.verbosity = modifier.modification.verbosity;
      }
      if (modifier.modification.encouragement) {
        result.encouragement = modifier.modification.encouragement;
      }
      if (modifier.modification.examples !== undefined) {
        result.examples = modifier.modification.examples;
      }
    }
  });

  return result;
}

/**
 * Calculate emotional response based on personality traits
 */
export function calculateEmotionalResponse(
  traits: PersonalityTrait[],
  userBehavior: string,
  currentIntensity: number
): {
  emotion: string;
  intensity: number;
} {
  const configs = traits.map(trait => DEFAULT_PERSONALITY_CONFIGS[trait]);
  const relevantTriggers = configs
    .flatMap(config => config.emotionalTriggers)
    .filter(trigger => userBehavior.includes(trigger.userBehavior));

  if (relevantTriggers.length === 0) {
    return {
      emotion: 'NEUTRAL',
      intensity: Math.max(0, currentIntensity - 5) // Gradual decay
    };
  }

  // Calculate weighted emotional response
  let totalWeight = 0;
  let weightedIntensityChange = 0;
  let dominantEmotion = 'NEUTRAL';
  let maxWeight = 0;

  relevantTriggers.forEach(trigger => {
    const config = configs.find(c => 
      c.emotionalTriggers.includes(trigger)
    );
    
    if (config) {
      const weight = config.weight / 100;
      totalWeight += weight;
      weightedIntensityChange += trigger.emotionalResponse.intensityModifier * weight;
      
      if (weight > maxWeight) {
        maxWeight = weight;
        dominantEmotion = trigger.emotionalResponse.emotion;
      }
    }
  });

  const newIntensity = Math.max(0, Math.min(100, 
    currentIntensity + (weightedIntensityChange / totalWeight)
  ));

  return {
    emotion: dominantEmotion,
    intensity: newIntensity
  };
}