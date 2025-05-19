const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;
const client = new MongoClient(process.env.MONGODB_URL);

const connectDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME);
    console.log('✅ MongoDB 연결 성공');
  }
};

const getDb = () => {
  if (!db) throw new Error('MongoDB가 연결되지 않았습니다.');
  return db;
};

module.exports = { connectDB, getDb };
