const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

var Schema = mongoose.Schema;
var SchemaTypes = mongoose.Schema.Types;

var Roles = new Schema({
    userId: SchemaTypes.Long,
    isAdmin: Boolean
});


module.exports = mongoose.model('Roles', Roles);