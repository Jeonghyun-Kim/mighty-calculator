import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

import { withErrorHandler } from '@utils/with-error-handler';
import { COOKIE_KEY_ACCESS_TOKEN, defaultCookieOptions } from '@defines/cookie';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    res.setHeader('Set-Cookie', [serialize(COOKIE_KEY_ACCESS_TOKEN, '', defaultCookieOptions)]);

    res.redirect('/');
  }
};

export default withErrorHandler(handler);
