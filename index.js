'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

process.title = "myApp";

// ------------------------------------------------------------

const app = express();
const port = 3000;


// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }));


// Endpoint Routers
const authRouter = require('./Routes/authRouter');
app.use('/auth', authRouter);

const storyRouter = require('./Routes/comicRouter');
app.use('/comic', comicRouter);

const comicRouter = require('./Routes/storyRouter');
app.use('/story', storyRouter);


// Database object



// Serving the static website pages
app.use(express.static(path.join(__dirname, 'Static')));


// Start the webserver
app.listen(port, () => console.log(`Warmup app listening on port ${port}!`));