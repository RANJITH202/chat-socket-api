require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

//Setup Cross Origin
app.use(cors());
app.use(express.json());

// Bring in the routes
app.use('/api/user', require('./routes/user'));
app.use('/api/messages', require('./routes/messages'));

// Setup error handlers
const errorHandlers = require('./handlers/errorHandler');
app.use(errorHandlers.notFound);
app.use(errorHandlers.mongoseErrors);
if (process.env.ENV === 'DEVELOPMENT') {
  app.use(errorHandlers.developmentErrors);
} else {
  app.use(errorHandlers.productionErrors);
}

module.exports = app;