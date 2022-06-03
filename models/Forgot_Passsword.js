const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

var Schema = mongoose.Schema;
var SchemaTypes = mongoose.Schema.Types;

var Forgot_Password = new Schema({
    StudentId: String,
    Email: String,
    VerificationCode: SchemaTypes.Long
});

module.exports = mongoose.model('Forgot_Password', Forgot_Password);