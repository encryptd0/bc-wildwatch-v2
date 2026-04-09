const crypto = require('crypto');

const COOKIE_NAME   = 'bcww_session';
const SESSION_TTL   = 8 * 60 * 60; // 8 hours in seconds

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-in-production';
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function encodeSession(user) {
  const data = {
    ...user,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL
  };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload   = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(payload);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))) return null;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Math.floor(Date.now() / 1000) > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function getSessionUser(req) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  return decodeSession(token);
}

function setSession(res, user) {
  const token = encodeSession(user);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL * 1000,
    path: '/'
  });
}

function clearSession(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

function getRole(email) {
  const admins = getAdminEmails();
  if (admins.includes(email.toLowerCase())) return 'admin';
  return 'student';
}

// Attach session user to res.locals for all views
function sessionLocals(req, res, next) {
  res.locals.sessionUser = getSessionUser(req);
  next();
}

// Require any authenticated session
function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) {
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  req.sessionUser = user;
  res.locals.sessionUser = user;
  next();
}

// Require admin role
function requireAdmin(req, res, next) {
  const user = getSessionUser(req);
  if (!user) {
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  if (user.role !== 'admin') {
    return res.status(403).render('403', { title: 'Access Denied - BC WildWatch' });
  }
  req.sessionUser = user;
  res.locals.sessionUser = user;
  next();
}

module.exports = { getSessionUser, setSession, clearSession, getRole, sessionLocals, requireAuth, requireAdmin, COOKIE_NAME };
