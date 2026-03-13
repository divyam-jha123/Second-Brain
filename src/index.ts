import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import router from './routes/notes.js';
import User from './routes/user.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI || '';

const app = express();

app.use(express.json());

app.use('/notes', router);
app.use('/user', User);

// conmnect to dbg and start thge server

async function startSever() {
    await mongoose.connect(MONGO_URL).then(() => {
        console.log('mongoDb is connected...');
    })
    .catch(() => {
        console.log('error while connecting mongoDb')
    })

    app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`)
    })
}

startSever();