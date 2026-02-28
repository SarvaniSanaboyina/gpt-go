const { verifyToken } = require("./crypto");

function requireAuth(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length);
  const auth = verifyToken(token);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.auth = auth;
  next();
}

module.exports = {
  requireAuth,
};
