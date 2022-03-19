module.exports = {
	database: process.env.DB,
	port: process.env.PORT,
	session_secret: process.env.SECRET,
	smtp_host: process.env.SMTPHOST,
	smtp_port: process.env.SMTPPORT,
	smtp_email: process.env.EMAIL,
	smtp_pass: process.env.PASS
}