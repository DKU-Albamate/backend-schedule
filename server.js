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
    // MongoDB 관련 코드는 제거되었습니다. Supabase가 데이터 저장소로 사용됩니다.
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
