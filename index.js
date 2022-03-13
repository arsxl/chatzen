const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
const randomNumber = require('random-number');

const app = express();

//Configuration
require('dotenv').config();
const conf = require('./config');
const port = conf.port;
const database = conf.database

//Models
const User = require('./models/User');
const Verification = require('./models/Verification');
const Roles = require('./models/Roles');

//Initializing app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src')));

//Database connection
mongoose.connect(database, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = global.Promise;
let db = mongoose.connection;

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

app.post('/account/register', function(request, response) {
	let student_id = request.body.studentid;
	let username = request.body.username;
	let nickname = request.body.nickname;
	let fullname = request.body.fullname;
	let password = request.body.password;

	let code_parameters = {
		min: 10000,
		max: 100000000,
		integer: true
	};

	if (student_id && username && nickname && fullname && password) {
		console.log("true")
		const verification_code = randomNumber(code_parameters);
		Verification.create({
			userId: 1,
			StudentId: student_id,
			Email: username,
			Nick: nickname,
			FullName: fullname,
			Password: password,
			VerificationCode: verification_code
		});
		response.send('Sucessfully registered, check your email to be able to login.');
		console.log(`${username}'s code is ${verification_code}`)
	} else {
		console.log("false")
		response.send('Not provided required information, try again.');
	}
});

app.get('/account/verification/:code', function (request, response) {
	const verification_code = request.params.code
	Verification.findOne({ VerificationCode: verification_code }, function (error, result) {
		if (result) {
			console.log("true")
			User.create({
				userId: result.userId,
				StudentId: result.StudentId,
				Email: result.Email,
				Nick: result.Nick,
				FullName: result.FullName,
				Password: result.Password
			});
			Verification.deleteOne({ VerificationCode: verification_code }, function (error) { });
			response.send('Email sucessfully verified.');
		} else {
			console.log("false")
			response.send('Invalid, either this link has expired or does not exist.');
		}
	});
});

const listener = app.listen(port, function() {
	console.log('Your app is listening on port ' + listener.address().port);
}); 