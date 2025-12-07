import { MongoClient, Db } from 'mongodb';
import type { BaseConfig } from '@ecom/config';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(config: BaseConfig): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'ecom';

  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(dbName);

  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase first.');
  }
  return db;
}
