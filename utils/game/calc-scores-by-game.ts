import { Game } from 'types/game';

export function calcScoresByGame({
  win,
  isNogi,
  isRun,
  _presidentId,
  _friendId,
  _oppositionIds,
  _diedId,
}: Game & { _diedId?: OurId }) {
  const score = (win ? 1 : -1) * (isNogi ? 2 : 1) * (isRun ? 2 : 1);
  const noFriend = _presidentId === _friendId;

  const providedIds = Array.from(
    new Set(
      [_presidentId, _friendId, ..._oppositionIds, _diedId].filter(
        (value): value is string => !!value,
      ),
    ),
  ).map((id) => String(id));

  const stats = { president: 0, friend: 0, opposition: 0 };

  return providedIds.map((userId) => {
    switch (userId) {
      case String(_presidentId): {
        return { userId, score: score * (noFriend ? 4 : 2), ...stats, president: win ? 1 : -1 };
      }

      case String(_friendId): {
        return { userId, score: score * 1, ...stats, friend: win ? 1 : -1 };
      }
    }

    if (_oppositionIds.map((id) => String(id)).includes(userId)) {
      return { userId, score: score * -1, ...stats, opposition: win ? -1 : 1 };
    }

    return { userId, score: 0, ...stats };
  });
}
