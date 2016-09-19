var mongoose = require('mongoose');


//Invitation Schema
//status 0- pending  1- joined the game
var InvitationSchema = mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	invitationCode: String,
	quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'QNewGame' },
	status: {type: Number, default: 0}},
	{ timestamps: true }
);




var QInvitation = module.exports = mongoose.model('QInvitation', InvitationSchema);

//Add Invitation
module.exports.addInvitation = function(invitation, callback){
	Invitation.create(invitation, callback);
};
