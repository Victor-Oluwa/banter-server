const User = require("../../../models/user_model");
const { decryptSecretKey } = require("../../../utils/encrypt");
const hashUserHash = require("../../../utils/hash_user_hash");


const getSecretKey = async (req, res) => {

    try {
        const { hash } = req.body;
        console.log(hash);

        const userHash = hashUserHash(hash);
        const user = await User.findOne({ hash: userHash });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { secretKey, _id } = user;
        const decryptedSecretKey = decryptSecretKey(secretKey, _id);

        res.status(200).json({ secretKey: decryptedSecretKey });

    } catch (e) {
        console.error(e);  // Use a logging library in production
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = getSecretKey;