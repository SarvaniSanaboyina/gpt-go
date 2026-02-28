const crypto = require("crypto");

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  return process.env.AUTH_SECRET || "dev-only-auth-secret-change-me";
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
  };
}

function verifyPassword(password, passwordSalt, passwordHash) {
  if (!passwordSalt || !passwordHash) return false;
  const hashed = hashPassword(password, passwordSalt);
  if (hashed.length !== passwordHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(passwordHash));
}

function signToken(userId) {
  const payload = {
    sub: userId,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadEncoded)
    .digest("base64url");
  return `${payloadEncoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadEncoded)
    .digest("base64url");
  if (signature.length !== expectedSignature.length) return null;

  const signatureMatches = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
  if (!signatureMatches) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf-8"));
  } catch (error) {
    return null;
  }

  if (!payload?.sub || !payload?.exp || payload.exp < Date.now()) {
    return null;
  }

  return {
    userId: Number(payload.sub),
  };
}

module.exports = {
  createPasswordRecord,
  verifyPassword,
  signToken,
  verifyToken,
};
