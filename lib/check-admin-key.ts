import { fetcher } from '@lib/fetcher';

interface CheckAdminKeyProps {
  adminKey: string;
}

export async function checkAdminKey({ adminKey }: CheckAdminKeyProps) {
  await fetcher('/api/admin', { headers: { Authorization: `Kay ${adminKey}` } });
}
