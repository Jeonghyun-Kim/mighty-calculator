import clientPromise from '.';

const dbName = process.env.MONGODB_NAME;

if (!dbName) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

export const connectMongo = async () => ({ db: (await clientPromise).db(dbName) });
