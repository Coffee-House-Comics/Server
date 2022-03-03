'use strict';

const app = require('./app');
const port = 3000;

process.title = "myServer";

// Recieve post request
app.post('/', function (req, res, next) {
    res.status(200).send("Hello!");
});

app.listen(port, () => console.log(`Warmup app listening on port ${port}!`))