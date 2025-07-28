/**
 * Generate a secure random string
 * @param length Length of the string
 * @returns Random string
 */
export declare function generateRandomString(length: number): string;
/**
 * Hash a password with a salt
 * @param password Password to hash
 * @param salt Salt to use (optional, will be generated if not provided)
 * @returns Object containing hash and salt
 */
export declare function hashPassword(password: string, salt?: string): {
    hash: string;
    salt: string;
};
/**
 * Verify a password against a hash
 * @param password Password to verify
 * @param hash Hash to verify against
 * @param salt Salt used to generate the hash
 * @returns Whether the password is valid
 */
export declare function verifyPassword(password: string, hash: string, salt: string): boolean;
/**
 * Generate a secure token
 * @param length Length of the token
 * @returns Secure token
 */
export declare function generateToken(length?: number): string;
/**
 * Sanitize user input to prevent XSS attacks
 * @param input Input to sanitize
 * @returns Sanitized input
 */
export declare function sanitizeInput(input: string): string;
/**
 * Encrypt data using AES-256-GCM
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Encrypted data
 */
export declare function encrypt(data: string, key: string): {
    encrypted: string;
    iv: string;
};
/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData Encrypted data
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Decrypted data
 */
export declare function decrypt(encryptedData: string, key: string, iv: string): string;
//# sourceMappingURL=index.d.ts.map