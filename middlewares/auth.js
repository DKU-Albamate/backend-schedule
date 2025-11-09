const admin = require('firebase-admin');

// FIREBASE_ADMIN_KEY는 Render 같은 환경에서 줄바꿈이 이스케이프된 "\\n" 형태로 들어올 수 있습니다.
// 안전하게 파싱하도록 처리합니다.
let firebaseConfig;
try {
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error('FIREBASE_ADMIN_KEY is not set');

  // 환경에 따라 private_key의 줄바꿈이 실제 개행 또는 "\\n" 문자열로 올 수 있으므로 치환 후 파싱
  const normalized = raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;

  // 이미 객체라면 그대로 사용(드물게 프로세스에서 객체로 주입되는 경우)
  firebaseConfig = typeof normalized === 'string' ? JSON.parse(normalized) : normalized;
} catch (err) {
  console.error('FIREBASE_ADMIN_KEY 파싱 오류:', err && err.message ? err.message : err);
  // 초기화 실패는 치명적이므로 명확한 로그를 남기고 프로세스 종료를 권장합니다.
  // Render에서 재시작/로그를 확인할 수 있게 에러를 던집니다.
  throw err;
}

// Firebase Admin SDK 초기화는 앱당 한 번만 수행
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '토큰 없음' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid }; // 인증된 사용자 uid를 req에 추가
    next();
  } catch (err) {
    console.error('인증 실패:', err && err.message ? err.message : err);
    return res.status(403).json({ success: false, message: '인증 실패' });
  }
};
