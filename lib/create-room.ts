import { fetcher } from '@lib/fetcher';

interface CreateRoomProps {
  title: string;
  participantIds: string[];
}

export async function createRoom({ title, participantIds }: CreateRoomProps) {
  const { roomId } = await fetcher<{ roomId: string }>('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, participantIds }),
  });

  return roomId;
}
