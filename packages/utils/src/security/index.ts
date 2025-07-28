import crypto from 'crypto';

/**
 * Generate a secure random string
 * @param length Length of the string
 * @returns Random string
 */
export function generateRandomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Hash a password with a salt
 * @param password Password to hash
 * @param salt Salt to use (optional, will be generated if not provided)
 * @returns Object containing hash and salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  
  return { hash, salt: generatedSalt };
}

/**
 * Verify a password against a hash
 * @param password Password to verify
 * @param hash Hash to verify against
 * @param salt Salt used to generate the hash
 * @returns Whether the password is valid
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const generatedHash = hashPassword(password, salt).hash;
  return generatedHash === hash;
}

/**
 * Generate a secure token
 * @param length Length of the token
 * @returns Secure token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input Input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Encrypt data using AES-256-GCM
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Encrypted data
 */
export function encrypt(data: string, key: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    encrypted: encrypted + authTag,
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData Encrypted data
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Decrypted data
 */
export function decrypt(encryptedData: string, key: string, iv: string): string {
  // Extract auth tag (last 32 chars of hex string = 16 bytes)
  const authTag = encryptedData.slice(-32);
  const encrypted = encryptedData.slice(0, -32);
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}