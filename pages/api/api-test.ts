import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@utils/with-error-handler';
import got from 'got';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    await got('http://3.38.9.149:3001/v1/trade', { headers: { Authorization: 'jongsik' } });

    return res.json({ hello: 'world' });
  }
};

export default withErrorHandler(handler);
