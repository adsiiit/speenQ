var mongoose = require('mongoose');


//New Game Schema
var NewGameSchema = mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true},
	name: String,
	grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required:true},
	invitationCode: {type:String, required:true},
	invitees: [{user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}, name: String}]},
	{ timestamps: true }
);




var QNewGame = module.exports = mongoose.model('QNewGame', NewGameSchema);

//Add NewGame
module.exports.addNewGame = function(newGame, callback){
	QNewGame.create(newGame, callback);
};
