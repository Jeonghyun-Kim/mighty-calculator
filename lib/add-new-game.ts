import { fetcher } from '@lib/fetcher';

import { Expand } from 'types';
import { Game } from 'types/game';

export type AddNewGameProps = Expand<
  Omit<Game, '_id' | '_roomId' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    _diedId: OurId | null;
  }
>;

export async function addNewGame(roomId: string, props: AddNewGameProps) {
  const { gameId } = await fetcher(`/api/room/${roomId}/game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props),
  });

  return gameId;
}
