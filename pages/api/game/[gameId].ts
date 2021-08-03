import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';

import { verifySession } from '@lib/server/verify-session';
import { createError } from '@defines/errors';
import { withErrorHandler } from '@utils/with-error-handler';
import { connectMongo } from '@utils/connect-mongo';
import { getUsersByIds } from '@lib/server/get-users-by-ids';
import { getGameByQuery } from '@utils/game';
import { getRoomById, isParticipant } from '@utils/room';

import { Game, gameSchema } from 'types/game';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const game = await getGameByQuery(req, res);

  if (req.method === 'GET') {
    verifySession(req, res);

    return res.json(game);
  }

  if (req.method === 'PUT') {
    verifySession(req, res);
    const { db } = await connectMongo();

    const room = await getRoomById(game._roomId);

    if (!room) return res.status(404).json(createError('NO_SUCH_ROOM'));
    if (room.state === 'ended') return res.status(400).json(createError('ROOM_ENDED'));

    const { _presidentId, _friendId, _oppositionIds, _diedId, type, isNogi, isRun, win } =
      (await gameSchema.validateAsync(req.body)) as Omit<
        Game,
        '_id' | '_roomId' | 'createdAt' | 'deletedAt'
      > & { _diedId: OurId | null };

    // check userIds validity.
    await getUsersByIds([_presidentId, _friendId, ..._oppositionIds, _diedId]);

    await db.collection<Game>('game').updateOne(
      { _id: game._id },
      {
        type,
        isNogi,
        isRun,
        win,
        _presidentId: new ObjectId(_presidentId),
        _friendId: _friendId ? new ObjectId(_friendId) : null,
        _oppositionIds: _oppositionIds.map((id) => new ObjectId(id)) as never,
        _diedId: _diedId ?? (undefined as never),
        updatedAt: new Date(),
      },
    );

    return res.status(204).end();
  }

  if (req.method === 'DELETE') {
    const { userId } = verifySession(req, res);

    const room = await getRoomById(game._roomId);

    if (!room) return res.status(404).json(createError('NO_SUCH_ROOM'));
    if (room.state === 'ended') return res.status(400).json(createError('ROOM_ENDED'));

    if (!isParticipant(userId, room)) {
      return res.status(403).json(createError('NO_PERMISSION'));
    }

    const { db } = await connectMongo();

    // TODO: update room scores

    await db
      .collection<Game>('game')
      .updateOne({ _id: game._id }, { $set: { deletedAt: new Date() } });

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
