const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./utils/mongoClient');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api/schedules', scheduleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
