var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//User Schema
var UserSchema = mongoose.Schema({
	name: String,
	email: { type : String , unique : true},
	provider: String,
	country: String,
	examination: String,
	phoneNumber: Number,
	role: String/*,
	last_login: { type: Date, default: Date.now }*/},
	{ timestamps: true }
	);



module.exports = mongoose.model('User', UserSchema);



