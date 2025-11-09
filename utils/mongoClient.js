// MongoDB 연결 유틸 (더 이상 기본으로 사용되지 않음)
// 이 파일은 레거시 호환성을 위해 남겨두지만, 기본 동작은 Supabase를 사용하도록 변경되었습니다.
require('dotenv').config();

const connectDB = async () => {
  if (!process.env.MONGODB_URL) {
    console.warn('MongoDB 연결을 시도하지 않습니다. MONGODB_URL이 설정되어 있지 않습니다.');
    return;
  }
  throw new Error('MongoDB 연결 로직이 더 이상 구현되어 있지 않습니다. 필요하면 MONGODB 사용 코드를 복원하세요.');
};

const getDb = () => {
  throw new Error('MongoDB는 더 이상 사용되지 않습니다. Supabase를 사용하세요.');
};

module.exports = { connectDB, getDb };
