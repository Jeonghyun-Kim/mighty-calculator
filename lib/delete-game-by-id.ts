import { fetcher } from '@lib/fetcher';

interface DeleteGameProps {
  gameId: OurId;
}

export async function deleteGameById({ gameId }: DeleteGameProps) {
  await fetcher.delete(`/api/game/${gameId}`);
}
