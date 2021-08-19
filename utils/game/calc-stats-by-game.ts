import { Game } from 'types/game';

export function calcStatsByGame({
  type,
  win,
  isNogi,
  isRun,
  _presidentId,
  _friendId,
  _oppositionIds,
  _diedId,
}: Game & { _diedId?: OurId }) {
  const providedIds = Array.from(
    new Set(
      [_presidentId, _friendId, ..._oppositionIds, _diedId].filter(
        (value): value is string => !!value,
      ),
    ),
  ).map((id) => String(id));

  return providedIds.map((userId) => {
    switch (userId) {
      case String(_presidentId): {
        const keys: string[] = [];
        const prefix = `stats${type}.president`;

        if (isNogi) {
          keys.push(`${prefix}.nogi`);
          if (isRun) {
            keys.push(win ? `${prefix}.nogiRun` : `${prefix}.nogiBackRun`);
          }
        } else if (isRun) {
          keys.push(win ? `${prefix}.run` : `${prefix}.backRun`);
        }

        return {
          userId,
          updateKeys: [`prefix.${win ? 'win' : 'lose'}`, ...keys],
        };
      }

      case String(_friendId): {
        return { userId, updateKeys: [`stats${type}.friend.${win ? 'win' : 'lose'}`] };
      }

      case String(_diedId): {
        if (type !== '6M') throw new Error('type must be 6M with _diedId.');
        return { userId, updateKeys: ['stats6M.died'] };
      }
    }

    if (_oppositionIds.map((id) => String(id)).includes(userId)) {
      return { userId, updateKeys: [`stats${type}.oppsite.${!win ? 'win' : 'lose'}`] };
    }

    throw new Error('Unreachable Line');

    return { userId, updateKeys: [] } as never;
  });
}
