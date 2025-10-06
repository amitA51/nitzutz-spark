import crypto from 'crypto';

function getKey(): Buffer | null {
  const secret = process.env.SECRET_KEY || '';
  if (!secret) return null;
  // If hex (64 chars) - interpret as hex key
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  // Otherwise, derive a 32-byte key from the string (utf8 -> sha256)
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Encrypt a JS object as a compact string. Uses AES-256-GCM.
 * Returns string with "enc:" prefix.
 */
export function encryptObject(obj: any): string {
  const key = getKey();
  if (!key) {
    // No key configured, store as plain JSON
    return JSON.stringify(obj);
  }
  const iv = crypto.randomBytes(12); // GCM recommended IV size
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Store as base64 of iv|tag|ciphertext
  const packed = Buffer.concat([iv, tag, encrypted]).toString('base64');
  return `enc:${packed}`;
}

/**
 * Decrypt string produced by encryptObject back to object.
 * If value does not start with "enc:" - attempts JSON.parse and returns result.
 */
export function decryptToObject(value: string): any {
  if (!value) return null;

  if (!value.startsWith('enc:')) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  const key = getKey();
  if (!key) {
    // Cannot decrypt without key
    return null;
  }

  try {
    const packed = Buffer.from(value.slice(4), 'base64');
    const iv = packed.subarray(0, 12);
    const tag = packed.subarray(12, 28);
    const ciphertext = packed.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return null;
  }
}