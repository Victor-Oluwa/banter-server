const Joi = require('joi');

const validateUser = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
        });

        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        next();
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = validateUser;
