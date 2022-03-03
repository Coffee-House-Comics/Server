'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

process.title = "myApp";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'Static')));

module.exports = app;