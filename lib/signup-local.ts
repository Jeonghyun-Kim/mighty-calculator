import { fetcher } from '@lib/fetcher';

import type { User } from 'types/user';

export type SignupLocalProps = Pick<User, 'email' | 'password' | 'name' | 'displayName'>;

export async function signupLocal(props: SignupLocalProps) {
  await fetcher.post('/api/user', { json: props });
}
