import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import Joi, { ValidationError } from 'joi';

import { withErrorHandler } from '@utils/with-error-handler';
import { verifySession } from '@lib/server/verify-session';
import { getUsersByIds } from '@lib/server/get-users-by-ids';
import { connectMongo } from '@utils/connect-mongo';

import { Room } from 'types/room';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    verifySession(req, res);

    const { db } = await connectMongo();

    const rooms = await db
      .collection<Room>('room')
      .find({ deletedAt: null }, { projection: { deletedAt: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ rooms });
  }

  if (req.method === 'POST') {
    const { userId } = verifySession(req, res);

    const roomSchema = Joi.object({
      title: Joi.string().max(30).required(),
      participantIds: Joi.array().items(Joi.string().hex().length(24)).min(4).max(5),
    }).prefs({
      errors: { label: 'key' },
    });

    const { title, participantIds } = (await roomSchema.validateAsync(req.body)) as {
      title: string;
      participantIds: string[];
    };

    for (const participantId of participantIds) {
      if (!ObjectId.isValid(participantId)) {
        throw new ValidationError(`invalid paricipantId: ${participantId}`, '', '');
      }
    }

    const participants = await getUsersByIds([userId, ...participantIds]);

    const { db } = await connectMongo();
    const { insertedId } = await db.collection<Room>('room').insertOne({
      state: 'inProgress',
      title,
      dealer: participants[0],
      participants: participants.map((user) => ({ user, score: 0 })),
      comments: [],
      createdAt: new Date(),
      deletedAt: null,
    });

    return res.status(201).json({ roomId: insertedId });
  }
};

export default withErrorHandler(handler);
