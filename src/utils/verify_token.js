const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
dotenv.config();

// Helper function to verify access token
const verifyToken = async (token, secret) => {
    try {
        const decoded = await jwt.verify(token, secret);
        // console.dir(decoded, { depth: null });
        return { valid: true, data: decoded };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { valid: false, error: 'Invalid or expired token' };
        }
        return { valid: false, error: 'Invalid token' };
    }
};

module.exports = verifyToken;