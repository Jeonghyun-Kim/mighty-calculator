import { DefaultSeo } from 'next-seo';
import { SWRConfig } from 'swr';

import ManagedUIContext from '@components/context';
import { CommonLayout } from '@components/layout';
import { fetcher } from '@lib/fetcher';

import type { AppProps } from 'next/app';

import '@assets/main.css';

const fetcherJson = async (url: string) => fetcher.get(url).json();

export default function App({ Component, pageProps }: AppProps) {
  const Layout = (Component as any).Layout || CommonLayout;

  return (
    <>
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
