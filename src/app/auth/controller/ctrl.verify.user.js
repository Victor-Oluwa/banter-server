const User = require("../../../models/user_model");
const { encryptSecretKey } = require("../../../utils/encrypt");
const generateToken = require("../../../utils/generate_token");
const verifyToken = require("../../../utils/verify_token");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const hashUserHash = require("../../../utils/hash_user_hash");
const { log } = require("console");

// Function to verify user and generate new tokens if necessary
const verifyUser = async (req, res) => {
    try {
        const { accessToken, refreshToken } = req.body;
        const userHash = crypto.randomBytes(32).toString('hex');

        // Verify and refresh tokens (await added)
        const result = await verifyAndRefreshToken(accessToken, refreshToken);
        if (result.success) {
            // Fetch user details using the userId from the token
            const user = await getUser(result.userId);

            // Create secret key and encrypt it
            const keys = createSecretKey(user);

            // Store the encrypted secret key in the user model
            user.secretKey = keys.encrypted;
            user.hash = hashUserHash(userHash);
            await user.save();

            // Respond with the new tokens, user data, and the plain secretKey
            return res.status(200).json({ tokens: result.tokens, user: user, secretKey: keys.secretKey, hash: userHash });
        } else {
            return res.status(401).json({ message: result.message });
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: e.message });
    }
};

// Helper function to create and encrypt a new secret key for the user
const createSecretKey = (user) => {
    const secretKey = crypto.randomBytes(32).toString('hex');  // Generate 32-byte random key
    const encryptedSecretKey = encryptSecretKey(secretKey, user._id);  // Encrypt the secret key with user ID
    return { secretKey: secretKey, encrypted: encryptedSecretKey };  // Return both plain and encrypted keys
};

// Helper function to fetch user by ID
const getUser = async (userId) => {
    console.log('passed ID: ' + userId);
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Failed to find user by ID');
    }
    return user;
};

// Function to verify and refresh tokens
const verifyAndRefreshToken = async (accessToken, refreshToken) => {
    // Verify the access token
    const accessVerification = await verifyToken(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if (accessVerification.valid) {
        log('Access key is valid');

        // Access token is valid, generate new tokens
        console.log('User data: ' + accessVerification.data)
        const userId = accessVerification.data.id;
        const newTokens = await generateToken(userId);
        return { success: true, tokens: newTokens, userId: userId };
    }

    // Access token is invalid or expired, check refresh token
    else if (accessVerification.error === 'Invalid or expired token') {
        log('Access key is invalid');
        // Verify the refresh token
        const refreshVerification = await verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // If refresh token is valid, generate new tokens
        if (refreshVerification.valid) {
            log('Refresh key is valid');
            // console.dir(refreshVerification, { depth: null });
            const userId = refreshVerification.data.id;
            const newTokens = await generateToken(userId);
            return { success: true, tokens: newTokens, userId: userId };
        }

        else if (accessVerification.error === 'Invalid or expired token') {
            log('Refresh key is invalid');

            return { success: false, message: 'Session expired. Please log in again.' };
        } else {
            return { success: false, message: 'Invalid token.' };

        }

    } else {
        // Access token is not valid, and no refresh token provided
        return { success: false, message: 'Invalid token.' };
    }
};

module.exports = verifyUser;
