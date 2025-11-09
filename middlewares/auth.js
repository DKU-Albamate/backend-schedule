const admin = require('firebase-admin');

// FIREBASE_ADMIN_KEY는 Render 같은 환경에서 줄바꿈이 이스케이프된 "\\n" 형태로 들어올 수 있습니다.
// 안전하게 파싱하도록 처리합니다.
let firebaseConfig;
try {
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error('FIREBASE_ADMIN_KEY is not set');

  // 이미 객체가 주입된 경우 (드물게) 바로 사용
  if (typeof raw !== 'string') {
    firebaseConfig = raw;
  } else {
    // 시도 1: 그대로 파싱
    try {
      firebaseConfig = JSON.parse(raw);
    } catch (e1) {
      // 시도 2: 이스케이프된 "\\n"을 실제 개행으로 바꾼 뒤 파싱
      try {
        const replaced = raw.replace(/\\\\n/g, '\\n');
        const normalized = replaced.includes('\\n') ? replaced.replace(/\\n/g, '\n') : replaced;
        firebaseConfig = JSON.parse(normalized);
      } catch (e2) {
        // 시도 3: private_key 내부의 실제 개행(또는 포맷 문제)을 이스케이프 시도
        try {
          const fixed = raw.replace(/("private_key"\s*:\s*")([\s\S]*?)(")/m, (_m, p1, p2, p3) => {
            // p2는 private_key 값(개행 포함 가능). 개행을 이스케이프 시킨다.
            const escaped = p2.replace(/\r?\n/g, '\\\\n');
            return p1 + escaped + p3;
          });
          firebaseConfig = JSON.parse(fixed);
        } catch (e3) {
          console.error('FIREBASE_ADMIN_KEY 파싱 시도 실패 (원본/normalized/fixed 모두 실패)');
          console.error('원본 길이:', raw.length);
          console.error('첫 200 chars:', raw.slice(0, 200));
          console.error('parse errors:', e1 && e1.message, e2 && e2.message, e3 && e3.message);
          throw e3;
        }
      }
    }
  }
} catch (err) {
  console.error('FIREBASE_ADMIN_KEY 파싱 오류:', err && err.message ? err.message : err);
  // 초기화 실패는 치명적이므로 에러를 던집니다.
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
