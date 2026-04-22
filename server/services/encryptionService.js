/**
 * Encryption Service
 * Handles AES-256-GCM logic for storing user API keys safely.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard

// Hash JWT_SECRET to force a deterministic 32-byte key for AES-256
const getMasterKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-encryption';
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptKey = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // AuthTag guarantees data integrity in GCM
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag
    };
  } catch (error) {
    logger.error('Encryption failed', { error: error.message });
    throw error;
  }
};

const decryptKey = (encryptedData, ivHex, authTagHex) => {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error: error.message });
    throw error;
  }
};

module.exports = { encryptKey, decryptKey };
