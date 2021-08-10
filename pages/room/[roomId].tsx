import type { GetStaticPaths, GetStaticProps } from 'next';
import type { ParsedUrlQuery } from 'querystring';
import { ObjectId } from 'mongodb';

import { DashboardLayout } from '@components/layout';
import { connectMongo } from '@utils/connect-mongo';

import { Room } from 'types/room';

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

interface PageProps {
  roomId: string;
}

interface Params extends ParsedUrlQuery {
  roomId: string;
}

export const getStaticProps: GetStaticProps<PageProps, Params> = async ({ params }) => {
  if (!params) throw new Error('missing params');

  const { db } = await connectMongo();
  const room = await db
    .collection<Room>('room')
    .findOne({ _id: new ObjectId(params.roomId), deletedAt: null }, { projection: { _id: 1 } });

  if (!room) return { notFound: true };

  return { props: { roomId: params.roomId } };
};

export default function RoomDetailsPage({ roomId }: PageProps) {
  return <div>roomId: {roomId}</div>;
}

RoomDetailsPage.Layout = DashboardLayout;
