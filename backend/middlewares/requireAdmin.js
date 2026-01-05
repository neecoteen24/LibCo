export default function requireAdmin(req, res, next) {
  if (!req.userId || req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
