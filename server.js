import dotenv from 'dotenv';
import startServer from './src/app.js';

dotenv.config();

const port = process.env.PORT || 8888;
startServer(port);