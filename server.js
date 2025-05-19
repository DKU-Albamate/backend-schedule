// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Render가 제공하는 포트 or 기본값 5000
const PORT = process.env.PORT || 5000;

// MongoDB 연결 후 서버 시작
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    app.listen(PORT, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err);
    process.exit(1); // 연결 실패 시 종료
  });

// 기본 라우터
app.get('/', (req, res) => {
  res.send('알바 스케줄 백엔드 실행 중!');
});
