import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';

import { verifySession } from '@lib/server/verify-session';
import { createError } from '@defines/errors';
import { withErrorHandler } from '@utils/with-error-handler';
import { connectMongo } from '@utils/connect-mongo';
import { getRoomByQuery } from '@utils/room';
import { getUsersByIds } from '@lib/server/get-users-by-ids';

import { gaemSchema, Game } from 'types/game';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const room = await getRoomByQuery(req, res);

  if (req.method === 'GET') {
    verifySession(req, res);

    const { db } = await connectMongo();

    const games = await db
      .collection<Game>('game')
      .find({ _roomId: room._id, deletedAt: null }, { projection: { deletedAt: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(games);
  }

  if (req.method === 'POST') {
    verifySession(req, res);

    if (room.state === 'ended') return res.status(400).json(createError('ROOM_ENDED'));

    const { _presidentId, _friendId, _oppositionIds, _diedId, type, giru, promise, win, run } =
      (await gaemSchema.validateAsync(req.body)) as Omit<
        Game,
        '_id' | '_roomId' | 'createdAt' | 'deletedAt'
      > & { _diedId: OurId | null };

    // check userIds validity.
    await getUsersByIds([_presidentId, _friendId, ..._oppositionIds, _diedId]);

    // TODO: Let's calculation win/ratio or others when the room ends.

    // const isNogi = giru === 'nogi';
    // const isRun = run;
    // const score = (win ? 1 : -1) * (isNogi ? 2 : 1) * (isRun ? 2 : 1);
    // const noFriend = Boolean(_friendId);

    // await Promise.all([
    //   // 주공
    //   await db.collection<User>('user').updateOne(
    //     {
    //       _id: new ObjectId(_presidentId),
    //     },
    //     { $inc: { [`stats${type}.`]: score * (noFriend ? 4 : 2) }, $set: { updatedAt: new Date() } },
    //   ),
    //   // 프렌
    //   _friendId &&  await db.collection<User>('user').updateOne(
    //     { _id: new ObjectId(_friendId) },
    //     { $inc: { } }
    //   )
    // ]);

    const { db } = await connectMongo();

    const { insertedId } = await db.collection<Game>('game').insertOne({
      _roomId: room._id,
      type,
      giru,
      promise,
      win,
      run,
      _presidentId: new ObjectId(_presidentId),
      _friendId: _friendId ? new ObjectId(_friendId) : null,
      _oppositionIds: _oppositionIds.map((id) => new ObjectId(id)) as never,
      _diedId: _diedId ?? (undefined as never),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    // TODO: update room scores

    return res.status(201).json({ gameId: insertedId });
  }
};

export default withErrorHandler(handler);
