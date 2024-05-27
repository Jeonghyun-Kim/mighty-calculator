import { verifySession } from '@lib/server/verify-session';
import { connectMongo } from '@utils/mongodb/connect';
import { withErrorHandler } from '@utils/with-error-handler';

import type { NextApiRequest, NextApiResponse } from 'next';
import type { User } from 'types/user';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    verifySession(req, res);

    const { db } = await connectMongo();
    const users = await db
      .collection<User>('user')
      .find({ approvedAt: { $ne: null } })
      .sort({ activatedAt: -1 })
      .project({
        name: 1,
        displayName: 1,
        email: 1,
        profileUrl: 1,
        activatedAt: 1,
      })
      .toArray();

    return res.json(users);
  }
};

export default withErrorHandler(handler);
