import Joi from 'joi';
import { isResSent } from 'next/dist/shared/lib/utils';

import { createError, isCustomError } from '@defines/errors';

import type { NextApiHandler } from 'next';

export function withErrorHandler(handler: NextApiHandler) {
  const wrappedHandler: NextApiHandler = async (req, res) => {
    try {
      await handler(req, res);

      if (!isResSent(res)) {
        res.status(400).json(createError('METHOD_NOT_EXISTS'));
      }
    } catch (err) {
      if (isResSent(res)) {
        return;
      }

      if (Joi.isError(err)) {
        return res.status(400).json(
          createError('VALIDATION_FAILED', {
            message: err.message,
          }),
        );
      }

      if (isCustomError(err)) {
        return res.status(res.statusCode >= 400 ? res.statusCode : 500).json(err);
      }

      return res
        .status(res.statusCode >= 400 ? res.statusCode : 500)
        .json(createError('INTERNAL_SERVER_ERROR', err));
    }
  };

  return wrappedHandler;
}
