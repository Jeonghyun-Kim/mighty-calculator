import Joi from 'joi';
import { NextApiRequest, NextApiResponse } from 'next';

import { verifySession } from '@lib/server/verify-session';
import { connectMongo } from '@utils/connect-mongo';
import { withErrorHandler } from '@utils/with-error-handler';

import { User } from 'types/user';

const cdn_url = process.env.CDN_URL;
if (!cdn_url) throw new Error('Missing CDN_URL');

const keyPrefix = `proof`;

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
          profileUrl: `${cdn_url}/${keyPrefix}/target/${key}`,
        },
      },
    );

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
