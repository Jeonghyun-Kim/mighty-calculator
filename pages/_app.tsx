import '@assets/main.css';
import 'nprogress/nprogress.css';

import { DefaultSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Script from 'next/script';
import NProgress from 'nprogress';
import { useEffect } from 'react';
import { SWRConfig } from 'swr';

import ManagedUIContext from '@components/context';
import { CommonLayout } from '@components/layout';

import { fetcher } from '@lib/fetcher';

import type { AppProps } from 'next/app';

NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
});

const fetcherJson = async (url: string) => fetcher.get(url).json();

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const Layout = (Component as any).Layout || CommonLayout;

  useEffect(() => {
    router.events.on('routeChangeStart', NProgress.start);
    router.events.on('routeChangeComplete', NProgress.done);
    router.events.on('routeChangeError', NProgress.done);

    return () => {
      router.events.off('routeChangeStart', NProgress.start);
      router.events.off('routeChangeComplete', NProgress.done);
      router.events.off('routeChangeError', NProgress.done);
    };
  }, [router]);

  return (
    <>
      <Script src="/js/redirectIE.js" strategy="beforeInteractive" />
      <DefaultSeo
        defaultTitle="Mighty Calculator"
        canonical="https://mighty.kay.kr/"
        additionalLinkTags={[{ rel: 'icon', href: '/favicon.ico' }]}
        openGraph={{
          type: 'website',
          title: 'SSHS Mighty Calulator',
          images: [
            {
              url: 'https://mighty.kay.kr/open-graph-v1.png',
              width: 1200,
              height: 630,
              alt: 'SSHS Mighty Calculator',
            },
          ],
        }}
        defaultOpenGraphImageWidth={1200}
        defaultOpenGraphVideoHeight={630}
      />
      <SWRConfig value={{ fetcher: fetcherJson }}>
        <ManagedUIContext>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ManagedUIContext>
      </SWRConfig>
    </>
  );
}
