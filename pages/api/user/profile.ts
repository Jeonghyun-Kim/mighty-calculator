import Joi from 'joi';
import { NextApiRequest, NextApiResponse } from 'next';

import { verifySession } from '@lib/server/verify-session';
import { connectMongo } from '@utils/mongodb/connect';
import { withErrorHandler } from '@utils/with-error-handler';

import type { User } from 'types/user';

const awsPublicUrl = process.env.AWS_PUBLIC_URL;
if (!awsPublicUrl) throw new Error('No such awsPublicUrl');

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { userId } = verifySession(req, res);
  if (req.method === 'POST') {
    const querySchema = Joi.object({
      key: Joi.string().label('key').max(100).required(),
    });

    const { key } = (await querySchema.validateAsync(req.query)) as { key: string };

    const { db } = await connectMongo();

    await db.collection<User>('user').updateOne(
      { _id: userId },
      {
        $set: {
          profileUrl: `${awsPublicUrl}/target/${key}`,
        },
      },
    );

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
