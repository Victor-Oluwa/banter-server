
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
dotenv.config();

const generateToken = async (id) => {

    const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '30m',
    },);

    const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30d',
    },);


    // console.log('RT Secret: ' + process.env.REFRESH_TOKEN_SECRET);

    console.log('Generated access token: ' + accessToken);
    console.log('Generated refresh token: ' + refreshToken);


    return { 'access_token': accessToken, 'refresh_token': refreshToken };
}


module.exports = generateToken;
