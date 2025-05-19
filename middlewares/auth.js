const admin = require('firebase-admin');

// 🔥 환경변수에서 JSON 문자열을 읽고 파싱
const firebaseConfig = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

// 🔐 Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '토큰 없음' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid }; // ✅ 인증된 사용자 uid를 req에 추가
    next();
  } catch (err) {
    console.error('인증 실패:', err.message);
    return res.status(403).json({ success: false, message: '인증 실패' });
  }
};
