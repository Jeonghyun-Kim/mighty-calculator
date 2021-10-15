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

    const querySchema = Joi.object({
      limit: Joi.number().min(0).required(),
    });

    const { limit = 0 } = (await querySchema.validateAsync(req.query)) as { limit: number };

    const { db } = await connectMongo();

    let roomCount;
    let openedRooms;
    if (limit === 0) {
      roomCount = await db.collection<Room>('room').count({ state: 'ended', deletedAt: null });

      openedRooms = (await db
        .collection<Room>('room')
        .find({ state: 'inProgress', deletedAt: null })
        .project({ deletedAt: 0 })
        .sort({ createdAt: -1 })
        .toArray()) as Room[];
    }

    const closedRooms = await db
      .collection<Room>('room')
      .find({ state: 'ended', deletedAt: null })
      .project({ deletedAt: 0 })
      .sort({ createdAt: -1 })
      .skip(limit * 12)
      .limit(12)
      .toArray();

    return res.json({
      rooms: openedRooms ? [...openedRooms, ...closedRooms] : closedRooms,
      roomCount,
    });
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
