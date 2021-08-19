import type { NextApiRequest, NextApiResponse } from 'next';

import { verifySession } from '@lib/server/verify-session';
import { withErrorHandler } from '@utils/with-error-handler';
import { connectMongo } from '@utils/connect-mongo';
import { compareId } from '@lib/server/compare-id';
import { getRoomByQuery } from '@utils/room';
import { calcScoresByGame } from '@utils/game/calc-scores-by-game';

import { Game } from 'types/game';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const room = await getRoomByQuery(req, res);

  if (req.method === 'GET') {
    verifySession(req, res);

    const { db } = await connectMongo();
    const games = await db
      .collection<Game>('game')
      .find({ _roomId: room._id, deletedAt: null }, { projection: { deletedAt: 0 } })
      .toArray();

    const scores = room.participants.map((user) => ({ user, score: 0 }));

    const scoreUpdates = games.map(calcScoresByGame).flat();

    scoreUpdates.forEach(({ userId, score }) => {
      const idx = scores.findIndex(({ user }) => compareId(user._id, userId));
      if (idx !== -1) scores[idx].score += score;
    });

    return res.json(scores);
  }
};

export default withErrorHandler(handler);
