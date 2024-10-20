const crypto = require('crypto');

// Encrypt the secret key using AES-256
function encryptSecretKey(secretKey, encryptionKey) {
    const iv = crypto.randomBytes(16); // Initialization vector
    const hashedKey = crypto.createHash('sha256').update(encryptionKey.toString()).digest(); // Hash the key to 32 bytes
    const cipher = crypto.createCipheriv('aes-256-cbc', hashedKey, iv);
    let encrypted = cipher.update(secretKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex'); // Store IV and encrypted key
}

// Decrypt the secret key
function decryptSecretKey(encryptedSecretKey, encryptionKey) {
    const parts = encryptedSecretKey.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const hashedKey = crypto.createHash('sha256').update(encryptionKey.toString()).digest(); // Hash the key to 32 bytes
    const decipher = crypto.createDecipheriv('aes-256-cbc', hashedKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = { encryptSecretKey, decryptSecretKey };
