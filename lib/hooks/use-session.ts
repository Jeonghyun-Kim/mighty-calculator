import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useSWR from 'swr';
import cookie from 'cookie';

import { COOKIE_KEY_REDIRECT_URL } from '@defines/cookie';
import { CustomError } from '@defines/errors';

// types
import { UserInfo } from 'types/user';

interface UseSessionOptions {
  savePath?: boolean;
  redirectTo?: string;
  redirectAs?: string;
  redirectIfFound?: boolean;
}

const defaultOptions: UseSessionOptions = {
  savePath: true,
  redirectIfFound: false,
};

export function useSession({
  savePath = defaultOptions.savePath,
  redirectTo,
  redirectAs,
  redirectIfFound = defaultOptions.redirectIfFound,
}: UseSessionOptions = defaultOptions) {
  const router = useRouter();

  const {
    data: user,
    mutate,
    error,
  } = useSWR<UserInfo>('/api/user', {
    refreshInterval: 30000,
    // revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  useEffect(() => {
    if (!user && !error) return;

    if (user && !error && redirectIfFound) {
      router
        .replace(redirectTo ?? (cookie.parse(document.cookie)[COOKIE_KEY_REDIRECT_URL] || '/'))
        .then(() => {
          document.cookie = `${COOKIE_KEY_REDIRECT_URL}=; Path=/`;
        });
    } else if ((!user || error) && redirectTo && !redirectIfFound) {
      console.log('redirect!!! to', redirectTo);
      if (savePath) {
        document.cookie = `${COOKIE_KEY_REDIRECT_URL}=${router.asPath}; Path=/`;
      }

      router.replace(redirectTo, redirectAs);
    }
  }, [user, error, redirectTo, redirectAs, redirectIfFound, savePath, router]);

  return {
    loading: !user && !error,
    user: !error ? user : undefined,
    error: error as CustomError | undefined,
    mutate,
  };
}
