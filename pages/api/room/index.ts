import Joi, { ValidationError } from 'joi';

import { isValidId } from '@lib/is-valid-id';
import { compareId } from '@lib/server/compare-id';
import { getUsersByIds } from '@lib/server/get-users-by-ids';
import { verifySession } from '@lib/server/verify-session';

import { connectMongo } from '@utils/mongodb/connect';
import { withErrorHandler } from '@utils/with-error-handler';

import { Room } from 'types/room';

import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    verifySession(req, res);

    const { db } = await connectMongo();

    const rooms = await db
      .collection<Room>('room')
      .find({ deletedAt: null })
      .project({ deletedAt: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(rooms);
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
      if (!isValidId(participantId)) {
        throw new ValidationError(`invalid paricipantId: ${participantId}`, '', '');
      }
    }

    const participants = await getUsersByIds([
      userId,
      ...participantIds.filter((id) => !compareId(id, userId)),
    ]);

    const { db } = await connectMongo();
    const { insertedId } = await db.collection<Room>('room').insertOne({
      state: 'inProgress',
      title,
      dealer: participants[0],
      participants,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      approvedAt: null,
    });

    return res.status(201).json({ roomId: insertedId });
  }
};

export default withErrorHandler(handler);
