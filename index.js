const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const app = express();

//Configuration
require('dotenv').config();
const conf = require('./config');
const port = conf.port;
const database = conf.database

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src')));

//Database connection
mongoose.connect(database, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = global.Promise;
var db = mongoose.connection;

console.log("Web app started")

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/register', function(request, response) {
	response.sendFile(path.join(__dirname + '/register.html'));
});

app.listen(port);