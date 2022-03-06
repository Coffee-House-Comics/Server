'use strict';

const app = require('./app');
const port = 3000;

process.title = "myServer";

// Recieve post request
app.post('/', function (req, res, next) {
    res.status(200).send("Hello!");
});

// Get request for story/comic end points (For testing)
app.get('/story', function(req, res, next) {
    res.status(200).send("Reached story endpoint");
});

app.get('/comic', function(req, res, next) {
    res.status(200).send("Reached Comic endpoint");
});

app.listen(port, () => console.log(`Warmup app listening on port ${port}!`));