const User = require("../../../models/user_model");
const generateToken = require("../../../utils/generate_token");

const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new instance of the User model
        const user = new User({
            name,
            email,
            password,
        });

        // Save the user instance (this will trigger the 'pre' save hook to hash the password)
        await user.save();

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e });
    }
};

module.exports = registerUser;