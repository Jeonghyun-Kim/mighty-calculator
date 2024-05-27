import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import cryptoRandomString from 'crypto-random-string';
import got from 'got';
import Joi from 'joi';
import sharp from 'sharp';

import { createError } from '@defines/errors';
import { verifySession } from '@lib/server/verify-session';
import { s3Client } from '@utils/aws/s3';
import { withErrorHandler } from '@utils/with-error-handler';

import type { NextApiRequest, NextApiResponse } from 'next';

const Bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
if (!Bucket) throw new Error('Missing AWS_PUBLIC_BUCKET_NAME');

const awsPublicUrl = process.env.AWS_PUBLIC_URL;
if (!awsPublicUrl) throw new Error('Missing awsPublicUrl');

const expiresIn = 300;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  verifySession(req, res);

  if (req.method === 'GET') {
    const querySchema = Joi.object({
      ext: Joi.string().label('extension').valid('jpeg', 'jpg', 'png').required(),
    });

    const { ext } = (await querySchema.validateAsync(req.query)) as { ext: string };

    const key = `${cryptoRandomString({ length: 10, type: 'url-safe' })}.${ext}`;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket,
      Key: `original/${key}`,
      Conditions: [{ Bucket }, ['content-length-range', 1, 50 * 1024 * 1024]],
      Fields: { acl: 'public-read' },
      Expires: expiresIn,
    });

    return res.status(201).json({ url, fields, key });
  }

  if (req.method === 'POST') {
    const querySchema = Joi.object({
      key: Joi.string().label('key').required(),
    });

    const { key } = (await querySchema.validateAsync(req.query)) as { key: string };

    const headCommand = new HeadObjectCommand({ Bucket, Key: `original/${key}` });

    try {
      await s3Client.send(headCommand);
    } catch (err) {
      if (err.name === 'NotFound') {
        return res.status(404).json(createError('AWS_NOT_FOUND'));
      }

      return res.status(500).json(createError('AWS_ERROR'));
    }

    const imgBuffer = await got(`${awsPublicUrl}/original/${key}`).buffer();

    if (!imgBuffer) return res.status(500).json(createError('INTERNAL_SERVER_ERROR'));

    const resizedImgBuffer = await sharp(imgBuffer)
      .clone()
      .resize({ width: 150, height: 150, withoutEnlargement: false })
      .jpeg({ quality: 40 })
      .withMetadata()
      .toBuffer();

    const { UploadId, Key } = await s3Client.send(
      new CreateMultipartUploadCommand({
        ACL: 'public-read',
        Bucket,
        Key: `target/${key}`,
      }),
    );

    const { ETag } = await s3Client.send(
      new UploadPartCommand({
        Bucket,
        Key,
        PartNumber: 1,
        UploadId,
        Body: resizedImgBuffer,
      }),
    );

    await s3Client
      .send(
        new CompleteMultipartUploadCommand({
          Bucket,
          Key,
          UploadId,
          MultipartUpload: { Parts: [{ ETag, PartNumber: 1 }] },
        }),
      )
      .catch(console.error);

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
