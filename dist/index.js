import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import router from './routes/notes.js';
dotenv.config();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI || '';
const app = express();
app.use(express.json());
app.use('/notes', router);
// conmnect to dbg and start thge server
async function startSever() {
    await mongoose.connect(MONGO_URL).then(() => {
        console.log('mongoDb is connected...');
    })
        .catch(() => {
        console.log('error while connecting mongoDb');
    });
    app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`);
    });
}
startSever();
//# sourceMappingURL=index.js.map