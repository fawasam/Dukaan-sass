import { Collection, ObjectId, WithId } from 'mongodb';
import { getDatabase } from './database.js';
import type { User, UserRole } from '../types/index.js';

type UserDocument = Omit<User, '_id'> & { _id?: ObjectId };

export function getUserCollection(): Collection<UserDocument> {
  return getDatabase().collection<UserDocument>('users');
}

export async function createUser(
  email: string,
  hashedPassword: string,
  role: UserRole = 'customer',
  displayName?: string,
): Promise<User> {
  const collection = getUserCollection();
  const now = new Date();

  const user: UserDocument = {
    email,
    password: hashedPassword,
    role,
    displayName,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(user);
  const inserted = await collection.findOne({ _id: result.insertedId });
  if (!inserted) throw new Error('Failed to create user');
  return { ...inserted, _id: inserted._id.toString() };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const collection = getUserCollection();
  const doc = await collection.findOne({ email });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

export async function findUserById(userId: string): Promise<User | null> {
  const collection = getUserCollection();
  const objectId = new ObjectId(userId);
  const doc = await collection.findOne({ _id: objectId });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  const collection = getUserCollection();
  const objectId = new ObjectId(userId);
  const { _id, ...updateData } = updates;
  await collection.updateOne({ _id: objectId }, { $set: { ...updateData, updatedAt: new Date() } });
}
