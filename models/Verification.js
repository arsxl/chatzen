const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

var Schema = mongoose.Schema;
var SchemaTypes = mongoose.Schema.Types;

var Verification = new Schema({
    StudentId: String,
    Email: String,
    Nick: String,
    FullName: String,
    Password: String,
    VerificationCode: SchemaTypes.Long
});

module.exports = mongoose.model('Verification', Verification);