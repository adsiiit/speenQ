var mongoose = require('mongoose');

//Quiz Attempt Schema
//score is 0 when answer is incorrect and 1 when it correct.
var quizattemptSchema = mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	questionId: { type: mongoose.Schema.Types.ObjectId },
	quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'QNewGame'},
	answerId: { type: mongoose.Schema.Types.ObjectId },
	timeTaken: Number,
	missed: Number,
	grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade'},
	plusMark: Number,
	minusMark: Number,
	score: Number},
	{ timestamps: true }
);

var Quizattempt = module.exports = mongoose.model('Quizattempt', quizattemptSchema);

//Add Quiz Attempt
module.exports.addQuizattempt = function(quizattempt, callback){
	Quizattempt.create(quizattempt, callback);
};