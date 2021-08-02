import NextLink from 'next/link';

import { Button } from '@components/ui';
import { useSession } from '@lib/hooks/use-session';
import { COOKIE_KEY_REDIRECT_URL } from '@defines/cookie';

export default function IndexPage() {
  useSession({ redirectTo: '/dashboard', redirectIfFound: true });

  return (
    <div className="max-w-screen-lg mx-auto py-8 px-4 sm:px-6">
      <h1 className="font-mono text-xl font-medium tracking-tighter">
        Mighty Network Score Calculator for SSHS 23rd
      </h1>
      <p className="mt-4">
        Made by{' '}
        <a className="text-blue-500 underline hover:opacity-70" href="mailto:kim.kay@kakao.com">
          Kay Kim
        </a>
      </p>
      <div className="mt-4 sm:mt-6 lg:mt-12">
        <NextLink href="/signin" passHref>
          <Button
            as="a"
            color="white"
            onClick={() => (document.cookie = `${COOKIE_KEY_REDIRECT_URL}=/dashboard; Path=/`)}
          >
            Sign in
          </Button>
        </NextLink>
      </div>
    </div>
  );
}
