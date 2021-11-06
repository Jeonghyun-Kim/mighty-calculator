import bcrypt from 'bcrypt';
import { ObjectId } from 'bson';
import Joi from 'joi';
import { NextApiRequest, NextApiResponse } from 'next';

import { SALT_ROUND } from '@defines/bcrypt';
import { createError } from '@defines/errors';

import { verifySession } from '@lib/server/verify-session';

import { connectMongo } from '@utils/mongodb/connect';
import { withErrorHandler } from '@utils/with-error-handler';

import { User } from 'types/user';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { userId } = verifySession(req, res);

  const { db } = await connectMongo();

  const user = await db
    .collection<User>('user')
    .findOne<{ _id: ObjectId; password: string }>({ _id: userId }, { projection: { password: 1 } });

  if (!user) return res.status(404).json(createError('NO_SUCH_USER'));

  if (req.method === 'PATCH') {
    const userSchema = Joi.object({
      password: Joi.string().min(8).max(30).required(),
    }).prefs({ errors: { label: 'key' } });

    const { password } = (await userSchema.validateAsync(req.body)) as Pick<User, 'password'>;

    if (await bcrypt.compare(password, user.password)) {
      return res.status(304).end();
    }

    await db.collection<User>('user').updateOne(
      { _id: user._id },
      {
        $set: {
          password: await bcrypt.hash(password, SALT_ROUND),
        },
      },
    );

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
