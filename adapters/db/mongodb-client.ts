import { Collection, Document, MongoClient } from 'mongodb';
import { getMongoDbUri } from '@config/service-base-urls';

export class MongoDbClient {
  private readonly client: MongoClient;

  constructor(uri: string = getMongoDbUri()) {
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  collection<TSchema extends Document = Document>(dbName: string, collectionName: string): Collection<TSchema> {
    return this.client.db(dbName).collection<TSchema>(collectionName);
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
