const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api/schedules', scheduleRoutes);

const startServer = async () => {
  try {
    // MongoDB를 더 이상 기본으로 사용하지 않습니다. 만약 기존 Mongo 연결이 필요하면
    // 환경변수 MONGODB_URL을 설정하여 연결을 활성화할 수 있습니다.
    if (process.env.MONGODB_URL) {
      const { connectDB } = require('./utils/mongoClient');
      await connectDB();
      console.log('MongoDB 연결 활성화 - MONGODB_URL이 설정되어 있습니다.');
    } else {
      console.log('MONGODB_URL 미설정 - MongoDB 연결을 스킵합니다 (Supabase 사용).');
    }

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ 서버 시작 실패:', err);
    process.exit(1);
  }
};

startServer();
