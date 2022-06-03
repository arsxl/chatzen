const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

var Schema = mongoose.Schema;
var SchemaTypes = mongoose.Schema.Types;

var StudentID = new Schema({
    StudentId: String
});

module.exports = mongoose.model('StudentID', StudentID);