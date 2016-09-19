var mongoose = require('mongoose');

//Friend List Schema
//status: 0-pending request, 1-accepted, 2-rejected
var FriendListSchema = mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	fName: String,
	fPhoneNumber: String,
	friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	status: {type: Number, default: 0}},
	{ timestamps: true }
);




var QFriendList = module.exports = mongoose.model('QFriendList', FriendListSchema);

//Add FriendList for some user
module.exports.addFriend = function(friend, callback){
	QFriendList.create(friend, callback);
};

//Reject Friend request
module.exports.rejectInvitation = function(userId,friendId, obj, options, callback){
	var query = {user: userId, friendId: friendId};
	var update = {
		user: obj.user,
		fName: obj.fName,
		fPhoneNumber: obj.fPhoneNumber,
		friendId: obj.friendId,
		status: 2
	}
	QFriendList.findOneAndUpdate(query, update, options, callback);
};

