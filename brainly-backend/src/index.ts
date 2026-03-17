import dotenv from "dotenv";
import mongoose from "mongoose";
import { createApp } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI || '';

// connect to db and start the server

async function startServer() {
    const app = createApp();

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

startServer();