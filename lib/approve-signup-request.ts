import { fetcher } from './fetcher';

interface ApproveSignupRequestProps {
  adminKey: string;
  userId: string;
}

export async function approveSignupRequest({ adminKey, userId }: ApproveSignupRequestProps) {
  await fetcher(`/api/admin/user?userId=${userId}`, {
    method: 'POST',
    headers: { Authorization: `Kay ${adminKey}` },
  });
}
