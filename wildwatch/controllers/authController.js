const crypto  = require('crypto');
const QRCode  = require('qrcode');
const AuthUser = require('../models/AuthUser');
const { setSession, clearSession, getRole } = require('../middleware/auth');

// ── Constants ────────────────────────────────────────────────
const ISSUER           = process.env.TWO_FACTOR_ISSUER  || 'BC WildWatch';
const CAMPUS_DOMAIN    = process.env.CAMPUS_DOMAIN      || 'belgiumcampus.ac.za';
const CHALLENGE_TTL    = 5 * 60; // 5 minutes
const TOTP_DIGITS      = 6;
const TOTP_PERIOD      = 30;
const BASE32_ALPHABET  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// ── Base32 helpers ───────────────────────────────────────────
function toBase32(buf) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function fromBase32(str) {
  const s = str.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
  if (!s || /[^A-Z2-7]/.test(s)) return null;
  let bits = 0, value = 0;
  const out = [];
  for (const ch of s) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

// ── TOTP ─────────────────────────────────────────────────────
function generateSecret() {
  return toBase32(crypto.randomBytes(20));
}

function totpUri(email, secret) {
  const label  = encodeURIComponent(`${ISSUER}:${email}`);
  const issuer = encodeURIComponent(ISSUER);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

function totpCode(secret, counter) {
  const key = fromBase32(secret);
  if (!key) return null;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hash   = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset]     & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8)  |
     (hash[offset + 3] & 0xff);
  return (binary % (10 ** TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0');
}

function verifyTotp(secret, code) {
  const clean = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  for (const drift of [-1, 0, 1]) {
    const gen = totpCode(secret, counter + drift);
    if (gen && gen === clean) return true;
  }
  return false;
}

// ── Challenge token (signed, TTL-bound) ──────────────────────
function getSecret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-in-production';
}

function signToken(payload) {
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const s = crypto.createHmac('sha256', getSecret()).update(p).digest('hex');
  return `${p}.${s}`;
}

function verifyToken(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const p = token.slice(0, dot);
  const s = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(p).digest('hex');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(s, 'utf8'), Buffer.from(expected, 'utf8'))) return null;
  } catch { return null; }
  try {
    const data = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    if (Math.floor(Date.now() / 1000) > data.exp) return null;
    return data;
  } catch { return null; }
}

// ── DB helpers ───────────────────────────────────────────────
async function getOrCreateAuthUser(email) {
  const norm = email.toLowerCase();
  let user = await AuthUser.findOne({ email: norm });
  if (!user) {
    user = await AuthUser.create({ email: norm, secret: generateSecret(), enabled: false });
  }
  return user;
}

async function enableAuthUser(email) {
  await AuthUser.findOneAndUpdate(
    { email: email.toLowerCase() },
    { enabled: true, updatedAt: new Date() }
  );
}

// ── Controllers ──────────────────────────────────────────────

exports.loginPage = (req, res) => {
  res.render('login', {
    title: 'Sign In - BC WildWatch',
    next: req.query.next || '/admin'
  });
};

exports.beginLogin = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const norm = email.trim().toLowerCase();
    if (!norm.endsWith('@' + CAMPUS_DOMAIN.toLowerCase())) {
      return res.status(400).json({ error: `Use your @${CAMPUS_DOMAIN} campus email.` });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected. Cannot process login.' });
    }

    const authUser = await getOrCreateAuthUser(norm);
    const setupRequired = !authUser.enabled;

    const challenge = {
      name:          name.trim(),
      email:         norm,
      setupRequired,
      iat:           Math.floor(Date.now() / 1000),
      exp:           Math.floor(Date.now() / 1000) + CHALLENGE_TTL,
      nonce:         crypto.randomUUID()
    };

    const payload = {
      challengeToken: signToken(challenge),
      setupRequired
    };

    if (setupRequired) {
      payload.setupKey = authUser.secret;
      payload.setupUri = totpUri(norm, authUser.secret);
      // Generate QR code as data URL
      payload.setupQr = await QRCode.toDataURL(payload.setupUri, {
        width: 220,
        margin: 2,
        color: { dark: '#0F2450', light: '#FFFFFF' }
      });
    }

    res.json(payload);
  } catch (err) {
    console.error('beginLogin error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

exports.verifyLogin = async (req, res) => {
  try {
    const { challengeToken, otpCode, next } = req.body;

    if (!challengeToken || !otpCode) {
      return res.status(400).json({ error: 'Challenge token and verification code are required.' });
    }

    const challenge = verifyToken(challengeToken);
    if (!challenge) {
      return res.status(401).json({ error: 'Session expired or invalid. Please start sign-in again.' });
    }

    const authUser = await AuthUser.findOne({ email: challenge.email });
    if (!authUser) {
      return res.status(401).json({ error: 'Account not found. Please start sign-in again.' });
    }

    if (!verifyTotp(authUser.secret, otpCode)) {
      return res.status(401).json({ error: 'Incorrect verification code. Please try again.' });
    }

    if (!authUser.enabled) {
      await enableAuthUser(challenge.email);
    }

    const user = {
      name:  challenge.name,
      email: challenge.email,
      role:  getRole(challenge.email)
    };

    setSession(res, user);

    res.json({ success: true, redirect: next || '/admin', user });
  } catch (err) {
    console.error('verifyLogin error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

exports.logout = (req, res) => {
  clearSession(res);
  res.redirect('/login');
};
