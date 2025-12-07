import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from './database.js';
import type { RefreshToken } from '../types/index.js';

type RefreshTokenDocument = Omit<RefreshToken, '_id'> & { _id?: ObjectId };

export function getRefreshTokenCollection(): Collection<RefreshTokenDocument> {
  return getDatabase().collection<RefreshTokenDocument>('refreshTokens');
}

export async function createRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<RefreshToken> {
  const collection = getRefreshTokenCollection();
  const now = new Date();

  const refreshToken: RefreshTokenDocument = {
    userId,
    token,
    expiresAt,
    createdAt: now,
  };

  const result = await collection.insertOne(refreshToken);
  const inserted = await collection.findOne({ _id: result.insertedId });
  if (!inserted) throw new Error('Failed to create refresh token');
  return { ...inserted, _id: inserted._id.toString() };
}

export async function findRefreshToken(token: string): Promise<RefreshToken | null> {
  const collection = getRefreshTokenCollection();
  const doc = await collection.findOne({ token });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

export async function deleteRefreshToken(token: string): Promise<void> {
  const collection = getRefreshTokenCollection();
  await collection.deleteOne({ token });
}

export async function deleteRefreshTokensByUserId(userId: string): Promise<void> {
  const collection = getRefreshTokenCollection();
  await collection.deleteMany({ userId });
}

export async function cleanupExpiredTokens(): Promise<void> {
  const collection = getRefreshTokenCollection();
  await collection.deleteMany({ expiresAt: { $lt: new Date() } });
}
