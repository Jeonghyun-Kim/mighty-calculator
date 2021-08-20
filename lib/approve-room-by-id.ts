import { fetcher } from '@lib/fetcher';

interface ApproveRoomByIdProps {
  adminKey: string;
  roomId: string;
}

export async function approveRoomById({ adminKey, roomId }: ApproveRoomByIdProps) {
  await fetcher(`/api/admin/room?roomId=${roomId}`, {
    method: 'POST',
    headers: { Authorization: `Kay ${adminKey}` },
  });
}
