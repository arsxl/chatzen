const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
const randomNumber = require('random-number');
const nodemailer = require('nodemailer')

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//Configuration
require('dotenv').config();
const conf = require('./config');
const port = conf.port;
const database = conf.database;
const session_secret = conf.session_secret;
const smtp_host = conf.smtp_host;
const smtp_port = conf.smtp_port;
const smtp_email = conf.smtp_email;
const smtp_pass = conf.smtp_pass;

//Models
const User = require('./models/User');
const Verification = require('./models/Verification');
const Roles = require('./models/Roles');

//Initializing app
app.use(session({
	secret: session_secret,
	resave: true,
	saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src')));

//Database connection
mongoose.connect(database, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = global.Promise;
let db = mongoose.connection;

console.log('Chatroom System started at http://localhost:' + port);

app.get('/', function(request, response) {
	if (request.session.loggedin) {
		response.redirect('/dashboard');
	} else {
		response.sendFile(path.join(__dirname + '/src/login.html'));
	}
});

app.get('/dashboard', function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/src/dashboard.html'));
	} else {
		response.redirect('/');
	}
});

app.get('/register', function(request, response) {
	response.sendFile(path.join(__dirname + '/src/register.html'));
});

app.get('/chat', function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/src/chat.html'));
	} else {
		response.redirect('/login');
	}
});

app.get('/account/logout', function(request, response) {
	if (request.session.loggedin) {
		request.session.destroy(function(error) { if (error) throw error; })
		response.redirect('/');
	} else {
		response.redirect('/');
	}
});

app.post('/authenticate', function(request, response) {
	let username = request.body.username;
	let password = request.body.password;

	if (username && password) {
		//console.log("true")
		User.findOne({ Email: username }, function (error, result) {
			if (error) throw error;

			if (result) {
				if (result.Password === password) {
					//console.log("password correct")
					request.session.loggedin = true;
					request.session.username = username;
					request.session.nickname = result.Nick

					const studentData = {
						studentID: result.StudentId,
						email: result.Email,
						nick: result.Nick,
						fullName: result.FullName,
					};

					response.json(studentData);

				} else {
					//console.log("password wrong")
					//response.send('Wrong password entered, try again')
					//response.redirect('/login')
					response.json({wrongPass: true});
				}
			} else {
				//console.log("no result")
				response.json({noResult: true});
			}
		});
	} else {
		response.json({invalid: true});
		//response.send('EMAIL AND/OR PASSWORD NOT ENTERED')
		//setTimeout(() => { response.redirect('/login') }, 5000);
	}
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
		
		const transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: smtp_email,
				pass: smtp_pass,
				}
		});

		const messageOptions = {
		subject: "Verify your Email - Chatzen",
		text: `Hey there ${fullname}, please click on the link https://chatzen.tk/account/verification/${verification_code} to verify your email.`,
		to: `${username}`,
		from: `No-Reply@Chatzen <${smtp_email}>`
		};

		transporter.sendMail(messageOptions);
		response.json({success: true});
		//response.send('Sucessfully registered, check your email to be able to login.');
		//response.end();
		console.log(`${username}'s code is ${verification_code}`)
	} else {
		console.log("false")
		response.json({invalid: true});
		//response.send('Not provided required information, try again.');
		//response.send();
	}
});

app.get('/account/verification/:code', function (request, response) {
	const verification_code = request.params.code
	Verification.findOne({ VerificationCode: verification_code }, function (error, result) {
		if (error) throw error;

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
			Verification.deleteOne({ VerificationCode: verification_code }, function (error) { if (error) throw error; });
			response.send('Email sucessfully verified.');
			response.send();
		} else {
			console.log("false")
			response.send('Invalid, either this link has expired or does not exist.');
			response.end();
		}
	});
});

io.on('connection', (socket) => {
	socket.on('chat message', (data) => {
		io.emit('chat message', { msg: data.msg, studentData: data.studentData });
	});
});

const listener = server.listen(port, function() {
	console.log('Your app is listening on port ' + listener.address().port);
}); 