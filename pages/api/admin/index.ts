import type { NextApiRequest, NextApiResponse } from 'next';

import { withErrorHandler } from '@utils/with-error-handler';
import { verifyAdminKey } from '@lib/server/verify-admin-key';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    verifyAdminKey(req, res);

    return res.json({ status: 'ok' });
  }
};

export default withErrorHandler(handler);
