import Joi from 'joi';

const ERROR_VARIANTS = ['CE', 'AE', 'KE', 'EE'] as const;
type ErrorCode = `${typeof ERROR_VARIANTS[number]}${number}`;

export interface CustomError {
  code: ErrorCode;
  name: string;
  message: string;
}

export function isCustomError(error: any): error is CustomError {
  try {
    Joi.assert(
      error,
      Joi.object({
        code: Joi.string().required().length(5),
        name: Joi.string().required(),
        message: Joi.string().required(),
      }),
    );
  } catch {
    return false;
  }

  return true;
}

// TODO: converting this function to the class `new CustomError()` instead? 🤔
export function createError(
  errName: keyof typeof ERRORS,
  overrides?: Partial<Omit<CustomError, 'code'>>,
): CustomError {
  const err = ERRORS[errName];
  return {
    code: err.code,
    name: overrides?.name || err.name,
    message: overrides?.message || err.message,
  };
}

const ERRORS = {
  // Common Error
  INTERNAL_SERVER_ERROR: {
    code: 'CE000',
    name: 'Internal server error',
    message: 'Unhandled error occured.',
  },
  METHOD_NOT_EXISTS: {
    code: 'CE001',
    name: 'Bad request method',
    message: 'Check request host and/or method.',
  },
  VALIDATION_FAILED: {
    code: 'CE002',
    name: 'Validation failed',
    message: "Check your request's validity.",
  },
  NO_PERMISSION: {
    code: 'CE003',
    name: 'No permission',
    message: 'No permission to execute the operation.',
  },

  // Authentication Error
  INVALID_TOKEN: {
    code: 'AE000',
    name: 'Invalid token',
    message: 'The token has been modified or something.',
  },
  TOKEN_EXPIRED: {
    code: 'AE001',
    name: 'Token expired',
    message: 'The token has been expired.',
  },
  TOKEN_EMPTY: {
    code: 'AE002',
    name: 'Token empty',
    message: 'You need to signin first.',
  },
  NO_SUCH_USER: {
    code: 'AE003',
    name: 'No such user',
    message: 'No such user with the given email address.',
  },
  WRONG_PASSWORD: {
    code: 'AE004',
    name: 'Wrong password',
    message: 'Try another one.',
  },
  MISSING_ADMIN_KEY: {
    code: 'AE101',
    name: 'Missing admin key',
    message: 'You need to embed Admin Key to request `Authorization` header.',
  },
  INVALID_ADMIN_KEY: {
    code: 'AE102',
    name: 'Wrong admin key',
    message: 'Check your admin key.',
  },

  // Kay Error
  USER_ALREADY_EXISTS: {
    code: 'KE001',
    name: 'User already exists',
    message: 'Try signin instead.',
  },

  // External Error
  AWS_ERROR: {
    code: 'EE001',
    name: 'AWS error',
    message: 'An error occured inside of AWS related processes.',
  },
  AWS_NOT_FOUND: {
    code: 'EE002',
    name: 'S3 Object not found',
    message: 'Object with the provided `key` was not found.',
  },
  MONGO_ERROR: {
    code: 'EE101',
    name: 'Mongo error',
    message: 'An error occured inside of mongodb related processes.',
  },
} as const;

export default ERRORS;
