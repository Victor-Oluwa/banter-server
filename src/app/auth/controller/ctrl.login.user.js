const User = require("../../../models/user_model");
const { encryptSecretKey } = require("../../../utils/encrypt");
const generateToken = require("../../../utils/generate_token");
const crypto = require('crypto');
const hashUserHash = require("../../../utils/hash_user_hash");

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const secretKey = crypto.randomBytes(32).toString('hex');
        const userHash = crypto.randomBytes(32).toString('hex');

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {

            const encryptedSecretKey = encryptSecretKey(secretKey, user._id);
            const hashedHash = hashUserHash(userHash);

            user.secretKey = encryptedSecretKey;
            user.hash = hashedHash;
            await user.save();

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: await generateToken(user._id),
                secretKey: secretKey,
                hash: userHash,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e });
    }

};


module.exports = loginUser;