const crypto = require('crypto');

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;

  const [salt, originalHash] = storedHash.split(':');
  const candidateHash = hashPassword(password, salt).split(':')[1];
  const original = Buffer.from(originalHash, 'hex');
  const candidate = Buffer.from(candidateHash, 'hex');

  return original.length === candidate.length && crypto.timingSafeEqual(original, candidate);
}

module.exports = { hashPassword, verifyPassword };
