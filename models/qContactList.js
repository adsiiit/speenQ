var mongoose = require('mongoose');

//Contact List Schema
var ContactListSchema = mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	name: String,
	contacts: [{name: String, phoneNumber: String}]},
	{ timestamps: true }
);




var QContactList = module.exports = mongoose.model('QContactList', ContactListSchema);

//Add Contact List for some user
module.exports.addContactList = function(contactList, callback){
	QContactList.create(contactList, callback);
};

