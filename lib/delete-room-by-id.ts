import { fetcher } from '@lib/fetcher';

interface DeleteRoomByIdProps {
  adminKey: string;
  roomId: string;
}

export async function deleteRoomById({ adminKey, roomId }: DeleteRoomByIdProps) {
  await fetcher(`/api/admin/room?roomId=${roomId}`, {
    method: 'DELETE',
    headers: { Authorization: `Kay ${adminKey}` },
  });
}
