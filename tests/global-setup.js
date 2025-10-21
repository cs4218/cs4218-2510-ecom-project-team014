import { MongoMemoryServer } from 'mongodb-memory-server';
import { populateData } from '../sample_data/populate_db.js';

async function globalSetup() {

  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  global.__MONGOD__ = mongod;
  process.env.MONGO_TEST_URI = mongoUri;

  console.log(`MongoDB Memory Server started at: ${mongoUri}`);

  console.log('Populating database with test data...');
  await populateData(mongoUri);

  console.log('Test database ready!');
}

export default globalSetup;
