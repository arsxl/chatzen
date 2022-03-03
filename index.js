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

console.log('Chatroom System started at http://localhost:' + port);

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/login', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/register', function(request, response) {
	response.sendFile(path.join(__dirname + '/register.html'));
});

app.post('/auth', function(request, response) {

});

app.post('/registration', function(request, response) {

});

app.post('/account/verification/:code', function (request, response) {
	let verCode = request.params.code
});

const listener = app.listen(port, function() {
	console.log('Your app is listening on port ' + listener.address().port);
}); 