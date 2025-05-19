const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin.json'); // 너의 Firebase Admin SDK

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '토큰 없음' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid };
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: '인증 실패' });
  }
};
