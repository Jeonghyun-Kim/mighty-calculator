import { Expand } from 'types';

import { fetcher } from '@lib/fetcher';

import { User } from 'types/user';

interface GetSignupRequestsProps {
  adminKey: string;
}

export async function getSignupRequests({ adminKey }: GetSignupRequestsProps) {
  const { users } = await fetcher
    .get('/api/admin/user', { headers: { Authorization: `Kay ${adminKey}` } })
    .json<{ users: Expand<Omit<User, 'password'>>[] }>();

  return users;
}
