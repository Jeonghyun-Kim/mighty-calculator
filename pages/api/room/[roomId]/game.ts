import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { ValidationError } from 'joi';

import { verifySession } from '@lib/server/verify-session';
import { createError } from '@defines/errors';
import { withErrorHandler } from '@utils/with-error-handler';
import { connectMongo } from '@utils/mongodb/connect';
import { getRoomByQuery } from '@utils/room';
import { isValidId } from '@lib/is-valid-id';
import { getGamesByRoomId } from '@utils/game';

import type { AddNewGameProps } from '@lib/add-new-game';
import { gameSchema, Game } from 'types/game';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const room = await getRoomByQuery(req, res);

  if (req.method === 'GET') {
    verifySession(req, res);

    const games = await getGamesByRoomId(room._id);

    return res.json(games);
  }

  if (req.method === 'POST') {
    verifySession(req, res);

    if (room.state === 'ended') return res.status(400).json(createError('ROOM_ENDED'));

    const { _presidentId, _friendId, _oppositionIds, _diedId, type, isNogi, isRun, win } =
      (await gameSchema.validateAsync(req.body)) as AddNewGameProps;

    const providedIds = Array.from(
      new Set(
        [_presidentId, _friendId, ..._oppositionIds, _diedId].filter(
          (value): value is string => !!value,
        ),
      ),
    );

    if (
      (type === '5M' && providedIds.length !== 5) ||
      (type === '6M' && providedIds.length !== 6)
    ) {
      throw new ValidationError('Duplicate ids are not allowed', '', '');
    }

    // check userIds validity.
    const participantIds = room.participants.map((user) => String(user._id));
    for (const userId of providedIds) {
      if (!isValidId(userId) || !participantIds.includes(userId))
        throw new ValidationError(`Invalid id: ${userId}`, '', '');
    }

    const { db } = await connectMongo();

    const { insertedId } = await db.collection<Game>('game').insertOne({
      _roomId: room._id,
      type,
      isNogi,
      isRun,
      win,
      _presidentId: new ObjectId(_presidentId),
      _friendId: new ObjectId(_friendId),
      _oppositionIds: _oppositionIds.map((id) => new ObjectId(id)) as never,
      _diedId: _diedId ?? (undefined as never),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    return res.status(201).json({ gameId: insertedId });
  }
};

export default withErrorHandler(handler);
