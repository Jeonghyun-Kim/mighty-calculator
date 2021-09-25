import { createError } from '@defines/errors';

import type { NextApiRequest, NextApiResponse } from 'next';

export function verifyAdminKey(req: NextApiRequest, res: NextApiResponse) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(400);
    throw createError('MISSING_ADMIN_KEY');
  }
  const [keyName, apiKey] = authorization.split(' ');

  if (keyName.toLowerCase() !== 'kay') {
    res.status(400);
    throw createError('MISSING_ADMIN_KEY');
  }

  if (apiKey !== process.env.ADMIN_API_KEY) {
    res.status(401);
    throw createError('INVALID_ADMIN_KEY');
  }
}
