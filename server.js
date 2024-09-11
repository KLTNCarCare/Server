require('dotenv').config();
const startServer = require('./src/app');
const port = process.env.PORT || 8888;
startServer(port);