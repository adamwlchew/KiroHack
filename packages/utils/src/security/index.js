"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomString = generateRandomString;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateToken = generateToken;
exports.sanitizeInput = sanitizeInput;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a secure random string
 * @param length Length of the string
 * @returns Random string
 */
function generateRandomString(length) {
    return crypto_1.default.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}
/**
 * Hash a password with a salt
 * @param password Password to hash
 * @param salt Salt to use (optional, will be generated if not provided)
 * @returns Object containing hash and salt
 */
function hashPassword(password, salt) {
    const generatedSalt = salt || crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: generatedSalt };
}
/**
 * Verify a password against a hash
 * @param password Password to verify
 * @param hash Hash to verify against
 * @param salt Salt used to generate the hash
 * @returns Whether the password is valid
 */
function verifyPassword(password, hash, salt) {
    const generatedHash = hashPassword(password, salt).hash;
    return generatedHash === hash;
}
/**
 * Generate a secure token
 * @param length Length of the token
 * @returns Secure token
 */
function generateToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
/**
 * Sanitize user input to prevent XSS attacks
 * @param input Input to sanitize
 * @returns Sanitized input
 */
function sanitizeInput(input) {
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
function encrypt(data, key) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
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
function decrypt(encryptedData, key, iv) {
    // Extract auth tag (last 32 chars of hex string = 16 bytes)
    const authTag = encryptedData.slice(-32);
    const encrypted = encryptedData.slice(0, -32);
    const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
//# sourceMappingURL=index.js.map