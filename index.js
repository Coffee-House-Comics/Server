'use strict';

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// ------------------------------------------------------------

// Extract the environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


// Middleware ------------------------------------------------
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
// Setup very relevant info
app.use(function (req, res, next) {
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // res.header("Access-Control-Allow-Credentials", true);
    res.header("Best-Dog", "SHADOW"); // :D
    next();
});

app.use(cors({
    origin: ['https://coffeehousecomics.com', 'http://test.localhost.com:3000'],
    credentials: true,
}));

// Endpoint Routers ------------------------------------------------
const authRouter = require('./Routes/authRouter');
app.use('/auth', authRouter);

const comicRouter = require('./Routes/comicRouter');
app.use('/comic', comicRouter);

const storyRouter = require('./Routes/storyRouter');
app.use('/story', storyRouter);


// Database object ------------------------------------------------
console.log("Initializing the database connection...");
mongoose
    .connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true })
    .catch(function (err) {
        console.error("Connection Error", err.message);
    });
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))


// Serving the static website pages ------------------------------------------------
console.log("Now serving the static webpage from /Static");
const dirPath = path.join(__dirname, 'Static');

app.use(express.static(dirPath));

// Handle 404
app.use(function (req, res) {
    res.status(404).sendFile(dirPath + '/404.html')
})
console.log("Now serving custom 404 for slick routing stuff");

// Start the webserver ------------------------------------------------
app.listen(port, () => console.log(`Server listening on port ${port}!`));