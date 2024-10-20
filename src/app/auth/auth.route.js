const express = require('express');

const validateUser = require('../../middleware/validation');
const registerUser = require('./controller/ctrl.register.user');
const loginUser = require('./controller/ctrl.login.user');
const verifyUser = require('./controller/ctrl.verify.user');
const getSecretKey = require('./controller/ctrl.get.secret.key');


const authRouter = express.Router();

authRouter.post('/register', validateUser, registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/verify-user', verifyUser);
authRouter.post('/get-secrete-key', getSecretKey);

module.exports = authRouter; 