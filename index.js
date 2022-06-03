// Dependencies
const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
const randomNumber = require('random-number');
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt');

// Express, SocketIO App
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
const saltRounds = 10;

// Models
const User = require('./models/User');
const Verification = require('./models/Verification');
const Roles = require('./models/Roles');
const Forgot_Password = require('./models/Forgot_Passsword');
const StudentID = require('./models/StudentID');
//const { constants } = require('buffer');

// Initializing App
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

app.get("/api/ping", (request, response) => {
	console.log("Ping received!");
	response.sendStatus(200);
  });

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

app.get('/chat', function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/src/chat.html'));
	} else {
		response.redirect('/');
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

// Update Password Start -->

app.get('/update', function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/src/update_password.html'));
	} else {
		response.redirect('/');
	}
});

app.post('/acccount/update_password', function(request, response) {
	const current_password = request.body.current_password;
    const new_password = request.body.new_password;
    const confirm_password = request.body.confirm_password;
    const user_email = request.body.user_email;

	User.findOne({ email: user_email }, function(error, result) {
		if (result) {
			console.log("account found");
			bcrypt.compare(current_password, result.Password, function(error, result) {
				if (error) throw error;

				if (result) {
					console.log("password matched");
					if (new_password == confirm_password) {
						bcrypt.hash(new_password, saltRounds, function(error, hash) {
							if (error) throw error;
							else {
								User.findOneAndUpdate({Email: user_email}, {$set: {Password: hash} }, function (error, result) {
									if (error) throw error;
									
									if (result) {
										response.json({success: true})
									}
								});
							}
						});
					} else {
						response.json({noPMatch: true});
					}
				} else {
					response.json({incorrectPassword: true});
				}
			});
		} else {
			response.json({accountNotFound: true});
		}
	});
});

// <-- Update Password End

// Login Start -->
// Add lower to make it case insensitive or add regex to check for valid email (throughout the code)
app.post('/authenticate', function(request, response) {
	const username = request.body.username;
	const password = request.body.password;

	if (username && password) {
		User.findOne({ Email: username }, function (error, result) {
			if (error) throw error;

			if (result) {
				const studentID = result.StudentId
				const email = result.Email
				const nick = result.Nick
				const fullName = result.FullName

				bcrypt.compare(password, result.Password, function(error, result) {
					if (error) throw error;

					if (result) {
						request.session.loggedin = true;
						request.session.username = username;
						request.session.nickname = nick;

						const studentData = {
							studentID: studentID,
							email: email,
							nick: nick,
							fullName: fullName,
						};

						response.json(studentData);
					} else {
						response.json({wrongPass: true});
					}
				});
			} else {
				response.json({noResult: true});
			}
		});
	} else {
		response.json({invalid: true});
	}
});

// <-- Login End

// Forgot Password Start -->

app.get('/forgot_password', function(request, response) {
	if (request.session.loggedin) {
		response.redirect('/dashboard');
	} else {
		response.sendFile(path.join(__dirname + '/src/forgot_password.html'));
	}
});

app.post('/account/password/reset/send_request', function(request, response) {
	const student_id = request.body.studentid;
	const username = request.body.username;
	
	let code_parameters = {
		min: 10000,
		max: 100000000,
		integer: true
	};

	if (student_id && username) {
		User.findOne({ StudentId: student_id }, function (error, result) {
			if (error) throw error;

			if (result) {
				if (result.Email === username) {
					const verification_code = randomNumber(code_parameters);
					Forgot_Password.create({
						StudentId: result.StudentId,
						Email: result.Email,
						VerificationCode: verification_code
					});
					const transporter = nodemailer.createTransport({
						service: "Gmail",
						auth: {
							user: smtp_email,
							pass: smtp_pass,
							}
					});
					message = {
						from: `No-Reply@Chatzen <${smtp_email}>`,
						to: `${username}`,
						subject: "Password Reset - Chatzen",
						text: `Hey there ${result.FullName}, please click on the link https://chatzen.tk/account/password/reset/${verification_code} to reset your password. Expires in 5 minutes.`
				    }
				    transporter.sendMail(message, function (error, info) { if (error) throw error; });
					setTimeout(() => {
						Forgot_Password.deleteOne({StudentId: student_id}, function(error) { if (error) throw error; });
					}, 300000);
					response.json({success: true});
				} else {
					response.json({invalidEmail: true});
				}
			} else {
				response.json({invalidStudentId: true});
			}
		});
	} else {
		response.json({invalidInput: true});
	}
});

app.get('/account/password/reset/:code', function (request, response) {
	const verification_code = request.params.code;
	
	Forgot_Password.findOne({ VerificationCode: verification_code }, function (error, result) {
		if (error) throw error;
		
		if (result) {
			response.sendFile(path.join(__dirname + '/src/reset_password.html'));
		} else {
			response.send('Invalid Link, please try again.');
		}
	});
});

app.post('/account/password/reset/process', function (request, response) {
	const username = request.body.username;
    const new_password = request.body.new_password;
    const confirm_password = request.body.confirm_password;
	const verification_code = request.body.verification_code;

	Forgot_Password.findOne({Email: username}, function (error, result) {
		if (error) throw error;

		if (result) {
			Forgot_Password.findOne({VerificationCode: verification_code}, function (error, result) {
				if (result) {
					if (new_password === confirm_password) {
						console.log('both passwords match')
						bcrypt.hash(new_password, saltRounds, function(error, hash) {
							if (error) throw error;
							else {
								User.findOneAndUpdate({Email: username}, {$set: {Password: hash} }, function (error, result) { if (error) throw error; });
								Forgot_Password.deleteOne({Email: username}, function(error) { if (error) throw error; });
								response.json({success: true});
							}
						});
					} else {
						response.json({noPMatch: true})
					}
				} else {
					response.json({invalidCode: true})
				}
			});
		} else {
			response.json({invalidRequest: true})
		}
	});
});

// <-- Forgot Password End

// Register Start -->

app.get('/register', function(request, response) {
	response.sendFile(path.join(__dirname + '/src/register.html'));
});

app.post('/account/register', function(request, response) {
	const student_id = request.body.studentid;
	const username = request.body.username;
	const nickname = request.body.nickname;
	const fullname = request.body.fullname;
	const password = request.body.password;

	let code_parameters = {
		min: 10000,
		max: 100000000,
		integer: true
	};
	if (student_id && username && nickname && fullname && password) {
		console.log("All fields are filled");
		StudentID.findOne({ StudentId: student_id }, function (error, result) {
			if (error) throw error;

			if (result) {
				User.findOne({ StudentId: student_id }, function (error, result) {
					if (error) throw error;
					
					if (result) {
						response.json({studentIdUsed: true});
						return;
					} else {
						Verification.findOne({ StudentId: student_id }, function (error, result) {
							if (result) {
								response.json({studentIdActiveRegistration: true});
								return;
							} else {
								console.log("Student ID is available");
								const emailValidation = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

								if (emailValidation.test(username)) {
									console.log("email is valid");
									Verification.findOne({ Email: username }, function (error, result) {
										if (error) throw error;

										if (result) {
											console.log("Email already exists");
											response.json({registrationExists: true});
											return;
										} else {
											User.findOne({ Email: username }, function (error, result) {
												if (error) throw error;

												if (result) {
													console.log("Email already exists");
													response.json({accountExists: true});
													return;
												} else {
													if (nickname.indexOf(' ') >= 0) {
														console.log("whitespace in nickname");
														response.json({whitespace: true});
														return;
													} else {
														console.log("no whitespace in nickname");
														if (password.length < 8) {
															console.log("password is too short");
															response.json({passwordTooShort: true});
															return;
														} else {
															console.log("password is long");
															bcrypt.hash(password, saltRounds, function(error, hash) {
																if (error) throw error;
																else {
																	console.log(hash);
																	const verification_code = randomNumber(code_parameters);
																	Verification.create({
																		StudentId: student_id,
																		Email: username,
																		Nick: nickname,
																		FullName: fullname,
																		Password: hash,
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
																	text: `Hey there ${fullname}, please click on the link https://chatzen.tk/account/verification/${verification_code} to verify your email. Valid for only 5 minutes`,
																	to: `${username}`,
																	from: `No-Reply@Chatzen <${smtp_email}>`
																	};
																	transporter.sendMail(messageOptions, function (error, info) { if (error) throw error; });
																	response.json({success: true});
																	setTimeout(() => {
																		Verification.deleteOne({StudentId: student_id}, function(error) { if (error) throw error; });
																	}, 300000);
																	console.log(`${username}'s code is ${verification_code}`)
																}
															});
														}
													}
												}
											});
										} 
									});
								} else {
									console.log("email is invalid");
									response.json({invalidEmail: true});
									return;
								}
							}
						});
					}
				});
			} else {
				console.log("Student ID is not listed");
				response.json({invalidStudentId: true});
				return;
			}
		});
	} else {
		response.json({invalidInput: true});
		return;
	}
});

app.get('/account/verification/:code', function (request, response) {
	const verification_code = request.params.code
	Verification.findOne({ VerificationCode: verification_code }, function (error, result) {
		if (error) throw error;

		if (result) {
			User.create({
				StudentId: result.StudentId,
				Email: result.Email,
				Nick: result.Nick,
				FullName: result.FullName,
				Password: result.Password
			});
			Verification.deleteOne({ VerificationCode: verification_code }, function (error) { if (error) throw error; });
			response.sendFile(path.join(__dirname + '/src/static/sucessful_verification.html'));
		} else {
			response.sendFile(path.join(__dirname + '/src/static/expired_link.html'));
		}
	});
});

// <-- Register End

io.on('connection', (socket) => {
	socket.on('chat message', (data) => {
		io.emit('chat message', { msg: data.msg, studentData: data.studentData });
	});
});

const listener = server.listen(port, function() {
	console.log('Your app is listening on port ' + listener.address().port);
}); 