
const express = require('express');
const cors = require('cors');

const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRouter = require('./src/app/auth/auth.route');
const noteRouter = require('./src/app/notes/route/note.route');
const PORT = process.env.PORT || 5000;


dotenv.config();

const app = express();

//Connect DB
connectDB();

//Middleware to pass Json request
app.use(express.json());
app.use(cors());


//Routes
app.use(authRouter);
app.use(noteRouter);


app.get('/', (req, res) => {
    res.send('API is runnning');
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


module.exports = app;
