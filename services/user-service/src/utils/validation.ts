import Joi from 'joi';

export const validateAuthRequest = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
  });

  return schema.validate(data);
};

export const validateRegisterRequest = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
    displayName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Display name must be at least 2 characters long',
      'string.max': 'Display name cannot exceed 50 characters',
      'any.required': 'Display name is required',
    }),
    attributes: Joi.object().optional(),
  });

  return schema.validate(data);
};

export const validatePasswordResetRequest = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  });

  return schema.validate(data);
};

export const validatePasswordResetConfirmRequest = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    confirmationCode: Joi.string().required().messages({
      'any.required': 'Confirmation code is required',
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required',
      }),
  });

  return schema.validate(data);
};

export const validateConfirmSignUpRequest = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    confirmationCode: Joi.string().required().messages({
      'any.required': 'Confirmation code is required',
    }),
  });

  return schema.validate(data);
};

export const validateMFASetupRequest = (data: any) => {
  const schema = Joi.object({
    mfaType: Joi.string().valid('SMS_MFA', 'SOFTWARE_TOKEN_MFA').required().messages({
      'any.only': 'MFA type must be either SMS_MFA or SOFTWARE_TOKEN_MFA',
      'any.required': 'MFA type is required',
    }),
    phoneNumber: Joi.when('mfaType', {
      is: 'SMS_MFA',
      then: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
        'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)',
        'any.required': 'Phone number is required for SMS MFA',
      }),
      otherwise: Joi.optional(),
    }),
  });

  return schema.validate(data);
};

export const validateMFAVerifyRequest = (data: any) => {
  const schema = Joi.object({
    session: Joi.string().required().messages({
      'any.required': 'Session is required',
    }),
    challengeName: Joi.string().required().messages({
      'any.required': 'Challenge name is required',
    }),
    challengeResponses: Joi.object().required().messages({
      'any.required': 'Challenge responses are required',
    }),
  });

  return schema.validate(data);
};