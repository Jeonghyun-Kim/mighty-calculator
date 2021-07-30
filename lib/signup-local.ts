import { fetcher } from '@lib/fetcher';
import { User } from 'types/user';

export type SignupLocalProps = Pick<User, 'email' | 'password' | 'name' | 'displayName'>;

export async function signupLocal(props: SignupLocalProps) {
  await fetcher('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(props),
  });
}
