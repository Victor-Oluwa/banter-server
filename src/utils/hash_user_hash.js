const crypto = require('crypto');
const dotenv = require('dotenv')


// Function to hash user ID using HMAC-SHA-256
function hashUserHash(userHash) {
    return crypto.createHmac('sha256', process.env.USER_HASH_SECRET_KEY)
        .update(userHash)
        .digest('hex');
}


module.exports = hashUserHash;
