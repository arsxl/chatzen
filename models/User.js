const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

var Schema = mongoose.Schema;
var SchemaTypes = mongoose.Schema.Types;

var User = new Schema({
    userId: SchemaTypes.Long,
    StudentId: String,
    Email: String,
    Nick: String,
    FullName: String,
    Password: String
});


module.exports = mongoose.model('User', User);