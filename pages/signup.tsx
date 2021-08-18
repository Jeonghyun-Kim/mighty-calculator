import { useCallback, useState } from 'react';
import NextImage from 'next/image';
import { useRouter } from 'next/router';
import cookie from 'cookie';

import { LockClosedIcon } from '@heroicons/react/outline';
import { Button, Link } from '@components/ui';
import { useSession } from '@lib/hooks/use-session';
import { useUI } from '@components/context';
import { COOKIE_KEY_REDIRECT_URL } from '@defines/cookie';
import { isBrowser } from '@utils/is-browser';
import { signupLocal, SignupLocalProps } from '@lib/signup-local';

import { useEmail } from './signin';

export default function SingupPage() {
  const router = useRouter();
  const { mutate } = useSession({
    redirectTo:
      (isBrowser() && cookie.parse(document.cookie)[COOKIE_KEY_REDIRECT_URL]) || '/dashboard',
    redirectIfFound: true,
  });

  // const [email, setEmail] = useState('');
  const [email, setEmail] = useEmail();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { alertNoti, showModal } = useUI();

  const requestSignup = useCallback(
    async (body: SignupLocalProps) => {
      try {
        setLoading(true);
        await signupLocal(body);

        showModal({
          title: 'Signup request successfully submitted',
          content:
            'Thank you for submitting the form. The admin will confirm and approve your request.',
          actionButton: {
            label: 'Confirm',
            onClick: () => router.push('/'),
          },
        });

        mutate();
      } catch (err) {
        alertNoti(err, 10);
      } finally {
        setLoading(false);
      }
    },
    [mutate, alertNoti, router, showModal],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <NextImage src="/assets/spades.svg" alt="Spade" width={48} height={57} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-medium text-gray-900 italic font-mono tracking-tight">
            Mighty Network SSHS 23rd
          </h2>
        </div>
        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            requestSignup({ email, password, name, displayName });
          }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="홍길동"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="email"
                  id="email"
                  className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password (length: 8 ~ 30)
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  id="password"
                  className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="YOUR_UNGUESSABLE_PASSWORD"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="confirm-password"
                  id="confirm-password"
                  className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="SAME_AS_GIVEN_PASSWORD"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between">
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <span className="text-sm text-gray-500" id="email-optional">
                  Optional
                </span>
              </div>
              <div className="mt-1">
                <input
                  type="text"
                  name="displayName"
                  id="displayName"
                  max={20}
                  className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="I AM GROOT"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" full className="relative capitalize" disabled={loading}>
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              Sign up
            </Button>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm capitalize">
              <Link href="/signin" className="font-medium text-teal-600 hover:text-teal-500">
                Sign in instead
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
