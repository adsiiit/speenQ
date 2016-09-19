var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
/*var passport = require('passport');*/
var jwt = require('express-jwt');
var randomstring = require("randomstring");

var Quizattempt = mongoose.model('Quizattempt');
var QContactList = mongoose.model('QContactList');
var QFriendList = mongoose.model('QFriendList');
var QInvitation = mongoose.model('QInvitation');
var QNewGame = mongoose.model('QNewGame');
var User = mongoose.model('User');

//acts as middleware
var config = require('../config');
/*var auth = jwt({secret: config.secret, userProperty: 'payload'});*/


module.exports = app;

//to create json document
app.use(bodyParser.json());


//connect to database using mongojs
var mongojs = require('mongojs');
var db=mongojs(config.mongo.db,['attempts','users','questions','grades','practicesets','subjects','quizattempts','answers','qfriendlists']);


//Quiz attempt of one question will be passed(user,questionId,quizId,timeTaken,answerId, grade), it will verify the correctness 
//of answer and set the values of (plusMark, minusMark, score and missed) fields accordingly and then store it in 'quizattempts'
// collection as a document
app.post('/quizattempt',function(req,res){
	var quizattempt = req.body;
	var a,b;
	//console.log(quizattempt);
	db.answers.findOne({_id: mongojs.ObjectId(quizattempt.answerId)}
			, function(err, que){
			if(err)
				res.send(err);
			a = que;
			//console.log(a.question);
			if(a!=null)
			{
				if(quizattempt.questionId == a.question && a.isCorrectAnswer==true)
				{
					db.questions.findOne({_id: mongojs.ObjectId(quizattempt.questionId)},
						function(err, que1){
							if(err)
								res.send(err);
							b = que1;
							/*quizattempt.plusMark = b.plusMark;*/
							quizattempt.plusMark = 1;
							quizattempt.minusMark = 0;
							quizattempt.score = 1;
							quizattempt.missed = 0;

							Quizattempt.addQuizattempt(quizattempt, function(err, quizattempt){
								if(err){
									res.json({"code": 500, "error": "Some error has occured"});
								}
								res.json(quizattempt);
							});

							//console.log(quizattempt);
						});
					 
				}
				else if(quizattempt.questionId == a.question && a.isCorrectAnswer==false)
				{
					db.questions.findOne({_id: mongojs.ObjectId(quizattempt.questionId)},
						function(err, que1){
							if(err)
								res.send(err);
							b = que1;
							quizattempt.plusMark = 0;
							/*quizattempt.minusMark = b.minusMark;*/
							quizattempt.minusMark = -1;
							quizattempt.score = 0;
							quizattempt.missed = 0;

							Quizattempt.addQuizattempt(quizattempt, function(err, quizattempt){
								if(err){
									res.json({"code": 500, "error": "Some error has occured"});
								}
								res.json(quizattempt);
							});
							//console.log(quizattempt);
						});
				}
				else
				{
					res.json({"code": 500, "error": "Some error has occurred.."});
				}
				//console.log("fafafdas");
			}
			else
			{
				quizattempt.plusMark = 0;
				quizattempt.minusMark = 0;
				quizattempt.score = 0;
				quizattempt.missed = 1;

				Quizattempt.addQuizattempt(quizattempt, function(err, quizattempt){
					if(err){
						res.json({"code": 500, "error": "Some error has occured"});
					}
					res.json(quizattempt);
				});
				//res.json({"code": 500, "error": "answerId doesn't exists."});
			}
			
		});

});



//This endpoint returns the list of grades along with their subjects
app.get('/gradesWithSubjects', function(req,res){
	db.grades.aggregate([
	{$unwind: "$subjects"},
	{$lookup:{from: "subjects", localField: "subjects", foreignField: "_id", as:"subjectdet"}},
	{$unwind: "$subjectdet"},
	{$project: {_id: 1, name: 1, "subjectdet._id": 1, "subjectdet.name": 1}},
	{$group: {_id: {_id: "$_id", name: "$name"}, subjects: {$addToSet: "$subjectdet"}}},
	{$project: {_id: "$_id._id", name: "$_id.name", subjects: 1}}
	], function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});



//Pass the userId, quizId & subjectId and it will return some random question(with options) which has not been already asked.
app.get('/randomQuestion/:user/:quizId/:subjectId', function(req,res){
	db.quizattempts.distinct("questionId",{"user":mongojs.ObjectId(req.params.user), "quizId" : mongojs.ObjectId(req.params.quizId)},
		function(err, id_list){
		if(err)
			res.send(err);
		db.questions.aggregate([
			{$match:{"subject._id": mongojs.ObjectId(req.params.subjectId)}},
			{$project: {plusMark: 1, minusMark: 1,questionHeader:1,questionText:1,
			  questionType:1,complexity:1}},
			 {$match: {_id: {$nin: id_list}}},
			 { $sample: {size: 1} },
			 {$lookup:{from: "answers", localField: "_id", foreignField: "question", as:"options"}},
             {$project: {plusMark: 1, minusMark: 1,questionHeader:1,questionText:1,questionType:1,complexity:1, "options._id":1, "options.answerText":1, "options.isCorrectAnswer":1}}
			], function(err, que){
			if(err)
				res.send(err);
			res.json(que[0]);
		});
	});
});


//Pass the subjectId and it will return some random question(with options).
app.get('/randomQuestionWOLogin/:subjectId', function(req,res){
		db.questions.aggregate([
			{$match:{"subject._id": mongojs.ObjectId(req.params.subjectId)}},
			{$project: {plusMark: 1, minusMark: 1,questionHeader:1,questionText:1,
			  questionType:1,complexity:1}},
			 { $sample: {size: 1} },
			 {$lookup:{from: "answers", localField: "_id", foreignField: "question", as:"options"}},
             {$project: {plusMark: 1, minusMark: 1,questionHeader:1,questionText:1,questionType:1,complexity:1, "options._id":1, "options.answerText":1, "options.isCorrectAnswer":1}}
			], function(err, que){
			if(err)
				res.send(err);
			res.json(que[0]);
		});
});



//Returns the options of given question(generally 4-5 options).
app.get('/questionOptions/:questionId', function(req,res){
	db.answers.find({"question" : mongojs.ObjectId(req.params.questionId)}, {answerText: 1, isCorrectAnswer:1},
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});



//Pass the userId and it will return quizId, name, grade and invitationCode of latest game.
app.get('/getPlayingGame/:userId', function(req,res){
	QInvitation.findOne({user: req.params.userId}, {_id: 0,quizId:1}, {sort:{'createdAt': -1}},
		function(err, que) {
	  	if(err)
			res.send(err);
		if(que)
		{
			QNewGame.findOne({_id: que.quizId},{name:1,grade:1, invitationCode:1}, 
				function(err, que2){
					if(err)
						res.send(err);
					else
						res.json(que2);
				});
		}
		else
		{
			QInvitation.findOne({invitee: req.params.userId, status:1}, {_id: 0,quizId:1}, {sort:{'createdAt': -1}},
				function(err,que1){
					if(err)
						res.send(err);
					else if(que1)
					{
						QNewGame.findOne({_id: que1.quizId}, {name:1,grade:1, invitationCode:1},
						function(err, que2){
							if(err)
								res.send(err);
							else
								res.json(que2);
						});
					}
					else
					{
						QNewGame.findOne({user: req.params.userId}, {name:1,grade:1, invitationCode:1},{sort:{'createdAt': -1}},
						function(err, que3){
							if(err)
								res.send(err);
							else
								res.json(que3);
						});
						//res.json({"error": "User neither played any game nor invited to play."});
					}
				});
			
		}
		
	});
});


//Pass the quizId and it will return scores of all the invited friends.
app.get('/getPlayersScores/:quizId', function(req,res){
	db.quizattempts.aggregate([
		{$match: {"quizId" : mongojs.ObjectId(req.params.quizId)}},
		{$project: {timeTaken:1, plusMark:1, minusMark:1, score:1, missed:1,user:1, _id: 0}},
		{$lookup:{from: "users", localField: "user", foreignField: "_id", as:"userDetails"}},
		{$unwind: "$userDetails"},
		{$project: {plusMark:1, minusMark:1, timeTaken:1, score:1, missed: 1,
		  "user.id": "$user", "user.name": "$userDetails.name", "user.phoneNumber": "$userDetails.phoneNumber"}},
		{$group: {_id: "$user", plusMarks: {$sum : "$plusMark"},minusMarks: {$sum : "$minusMark"},totalCorrect: {$sum : "$score"}, totalQuestions: {$sum: 1}, totalMissed: {$sum: "$missed"},totalTime: {$sum: "$timeTaken"}}},
		{$project: {playerId: "$_id.id", playerName: "$_id.name", playerContact: "$_id.phoneNumber",_id:0,plusMarks:1, minusMarks:1, totalCorrect:1, totalQuestions:1, totalMissed: 1, totalTime:1, score: {$add:["$plusMarks","$minusMarks"]}}}
		], function(err, que){
			if(err)
				res.send(err);
			res.json(que);
		});
});




//Pass user-ID, name, grade-ID, invitees-ARRAY and it will return gameId and invitationCode
app.post('/newGame',function(req,res){
	var newGame = req.body;
	//console.log(newGame);
	newGame.invitationCode = randomstring.generate(10);
	QNewGame.addNewGame(newGame, function(err, newgame){
		if(err){
			res.json({"code": 500, "error": "Some error occured."});
		}
		else
		{
			var invitees = newgame.invitees;
			var invitations = [];
			for (var i = 0; i < invitees.length; i++)
			{
				var doc = {"user": newgame.user, "invitationCode": newgame.invitationCode,
					"quizId": newgame._id, "invitee": invitees[i].user};
				//doc.invitee = invitees[i].user;

			    invitations.push(doc);
			    console.log(invitations);
			}
			QInvitation.insertMany(invitations, function(error, docs) {
				//console.log(docs);
				var response = {"quizId": newgame._id, "userId": newgame.user, "gameName": newgame.name, "gradeId": newgame.grade, "invitationCode": newgame.invitationCode, "invitees": newgame.invitees};
				res.json(response);
			});
		}
	});
});


//Pass invitationCode and user-ID and it returns quizId
app.get('/joinGame/:user/:invitationCode', function(req,res){
	var query = {invitee: req.params.user, invitationCode: req.params.invitationCode};
	QInvitation.findOne(query,
		function(err, que){
		if(err)
			res.send(err);
		if(que)
		{
			var update = {
			user: que.user,
			invitationCode: que.invitationCode,
			quizId: que.quizId,
			invitee: que.invitee,
			status: 1
			}
			QInvitation.findOneAndUpdate(query, update, {new: true},
				function(err, updobj){
				if(err)
					res.send(err);
				QNewGame.findOne({_id: updobj.quizId},
					function(err, result){
					if(err)
						res.send(err);
					res.json({"quizId": result._id, "userId": result.user, "gameName": result.name, "gradeId": result.grade, "invitationCode": result.invitationCode, "invitees": result.invitees});
				});
				
			});
		}
		else
			res.json({"code": 500, "error": "Either invitation code is invalid or User is not invited."});
		
	});
});


//Pending game requests to some user
app.get('/pendingGameRequests/:user', function(req,res){
	var userId = req.params.user;
	QInvitation.find({invitee: userId, status:0},{_id:0, createdAt:1, quizId:1, invitationCode:1, user:1},
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});


/////// FRIEND REQUEST PART   -- STARTS  ////////////////////


//Pass (user, fName, fPhoneNumber, friendId)
app.post('/addFriend',function(req,res){
	var friend = req.body;
	var instance = {"user": friend.user, "fName": friend.fName, "fPhoneNumber": friend.fPhoneNumber,
						"friendId": friend.friendId}
	QFriendList.findOne({user: friend.user, friendId: friend.friendId},
		function(err, que){
		if(err)
			res.send(err);
		if(que)
		{
			res.json({"error": "Request has been already sent."});
		}
		else
		{

			QFriendList.findOne({user: friend.friendId, friendId: friend.user},
				function(err, que1){
				if(err)
					res.send(err);
				if(que1)
				{
					res.json({"error": "Your friend has already sent you the request."});
				}
				else
				{
					QFriendList.addFriend(instance, function(err, friend){
						if(err){
							res.json({"code": 500, "error": "Some error occured."});
						}
						res.json(friend);
					});
				}

			});
		}
	});
});


//This will return all the users(_id, name, phoneNumber) that we can use for searching.
app.get('/getUsers', function(req,res){
	db.users.find({}, {name:1, phoneNumber:1},
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});


//Pass userId and it will return all the friends of that user(fName, fPhoneNumber, friendId) that we can use for searching friends.
app.get('/searchFriends/:user', function(req,res){
	var user = req.params.user;
	db.qfriendlists.find({user: mongojs.ObjectId(user), status: { $in: [0, 1] }}, {fName:1, fPhoneNumber:1, friendId:1},
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});

//Pass userId and friendId and it will remove their documents in qfriendlists collection.
app.delete('/removeFriend/:user/:friend', function(req,res){
	var userId = req.params.user;
	var friendId = req.params.friend;
	db.qfriendlists.remove({user : mongojs.ObjectId(userId), friendId: mongojs.ObjectId(friendId)},
		function(err, que1){
		if(err)
			res.send(err);
		if(que1)
		{
			db.qfriendlists.remove({user : mongojs.ObjectId(friendId), friendId: mongojs.ObjectId(userId)},
				function(err, que2){
				if(err)
					res.send(err);
				res.json(que2);
			});
		}
		else
		{
			res.json({"error": "pass valid userId and friendId."});
		}
		
	});
});



//Endpoint to reject friend request.
app.get('/rejectInvitationRequest/:user/:friend', function(req,res){
	var userId = req.params.friend;
	var friendId = req.params.user;
	QFriendList.findOne({user: userId, friendId: friendId},
		function(err, que){
		if(err)
			res.send(err);
		else if(que)
		{
			QFriendList.rejectInvitation(userId, friendId, que, {new: true}, function(err, updobj){
				if(err){
					res.send(err);
				}
				res.json(updobj);
			});
		}
		else
		{
			res.json({"error": "Wrong userId or friendId is passed."});
		}
	});
});


//Endpoint to accept friend request
//Status of existing document is changed to 1
//New Document is created with inverse relationship and status 1( user-friend <=> friend-user).
app.get('/acceptInvitationRequest/:user/:friend', function(req,res){
	var userId = req.params.friend;
	var friendId = req.params.user;
	QFriendList.findOne({user: userId, friendId: friendId},
		function(err, que){
		if(err)
			res.send(err);
		if(que)
		{
			var update = {
			user: que.user,
			fName: que.fName,
			fPhoneNumber: que.fPhoneNumber,
			friendId: que.friendId,
			status: 1
			}
			QFriendList.findOneAndUpdate({user: userId, friendId: friendId}, update, {new: true},
				function(err, updobj){
				if(err){
					res.send(err);
				}

				User.findOne({_id: userId},{name:1, phoneNumber:1},
					function(err, que2){
					if(err)
						res.send(err);
					console.log(que2);
					var instance = {
						user: friendId,
						fName: que2.name,
						fPhoneNumber: que2.phoneNumber,
						friendId: que2._id,
						status: 1
					}
					QFriendList.addFriend(instance, function(err, friend){
						if(err){
							res.json({"code": 500, "error": "Some error occured."});
						}
						res.json(friend);
					});
					//res.json(updobj);
				});

			});
		}
		else
		{
			res.json({"error": "Wrong userId or friendId is passed."});
		}

	});
});


//Pending requests OF some user
app.get('/pendingRequests/:user', function(req,res){
	var userId = req.params.user;
	QFriendList.find({user: userId, status:0},
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});

//Pending requests TO some user
app.get('/pendingRequestsTo/:user', function(req,res){
	var userId = req.params.user;
	QFriendList.find({friendId: userId, status:0},
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});

//Rejected requests OF some user
app.get('/rejectedRequests/:user', function(req,res){
	var userId = req.params.user;
	QFriendList.find({user: userId, status:2},
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});



/////// FRIEND REQUEST PART   -- ENDS  ////////////////////


/////// PERFORMANCE PART   - -- STARTS   ///////////////////



//Pass userid and quizid and it will return all the documents associated with it
app.get('/detailedSummary/:user/:quizId', function(req,res){
	db.quizattempts.find({"user" : mongojs.ObjectId(req.params.user), "quizId" : mongojs.ObjectId(req.params.quizId)},
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});

//Pass userid and quizid and it will return the summary.
app.get('/summary/:user/:quizId', function(req,res){
	db.quizattempts.aggregate([
	{$match: {"user" : mongojs.ObjectId(req.params.user), "quizId" : mongojs.ObjectId(req.params.quizId)}},
	{$project: {timeTaken:1, plusMark:1, minusMark:1, score:1, missed:1, _id: 0}},
	{$group: {_id: null, plusMarks: {$sum : "$plusMark"},minusMarks: {$sum : "$minusMark"},totalCorrect: {$sum : "$score"}, totalQuestions: {$sum: 1}, totalMissed: {$sum: "$missed"},totalTime: {$sum: "$timeTaken"}}},
	{$project: {_id: 0, plusMarks:1, minusMarks:1, totalCorrect:1, totalQuestions:1, totalMissed: 1, totalTime:1}}
	],
		function(err, que){
		if(err)
			res.send(err);
		res.json(que[0]);
	});
});



// When only userId is passed
app.get('/getPerformance/:user', function(req,res){
	db.quizattempts.aggregate([
	{$lookup:{from: "questions", localField: "questionId", foreignField: "_id", as:"questionDetails"}},
	{$unwind: "$questionDetails"},
	{$project: {timeTaken:1, plusMark:1, minusMark:1, score:1, missed:1, _id: 0, subject: "$questionDetails.subject._id"}},
	{$lookup:{from: "subjects", localField: "subject", foreignField: "_id", as:"subjectDetails"}},
	{$unwind: "$subjectDetails"},
	{$group: {_id: {subjectId: "$subjectDetails._id", subjectName: "$subjectDetails.name"}, plusMarks: {$sum : "$plusMark"},minusMarks: {$sum : "$minusMark"},totalCorrect: {$sum : "$score"}, totalQuestions: {$sum: 1}, totalMissed: {$sum: "$missed"},totalTime: {$sum: "$timeTaken"}}},
	{$project: {subjectId: "$_id.subjectId", subjectName: "$_id.subjectName", plusMarks:1, minusMarks:1, totalCorrect:1, totalQuestions:1, totalMissed: 1, totalTime:1, _id:0}}
	],
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});


//When userId and GradeId are passed
app.get('/getPerformance/:user/:grade', function(req,res){
	db.quizattempts.aggregate([
	{$match: {"user" : mongojs.ObjectId(req.params.user), "grade" : mongojs.ObjectId(req.params.grade)}},
	{$lookup:{from: "questions", localField: "questionId", foreignField: "_id", as:"questionDetails"}},
	{$unwind: "$questionDetails"},
	{$project: {timeTaken:1, plusMark:1, minusMark:1, score:1, missed:1, _id: 0, subject: "$questionDetails.subject._id"}},
	{$lookup:{from: "subjects", localField: "subject", foreignField: "_id", as:"subjectDetails"}},
	{$unwind: "$subjectDetails"},
	{$group: {_id: {subjectId: "$subjectDetails._id", subjectName: "$subjectDetails.name"}, plusMarks: {$sum : "$plusMark"},minusMarks: {$sum : "$minusMark"},totalCorrect: {$sum : "$score"}, totalQuestions: {$sum: 1}, totalMissed: {$sum: "$missed"},totalTime: {$sum: "$timeTaken"}}},
	{$project: {subjectId: "$_id.subjectId", subjectName: "$_id.subjectName", plusMarks:1, minusMarks:1, totalCorrect:1, totalQuestions:1, totalMissed: 1, totalTime:1, _id:0}}
	],
		function(err, que){
		if(err)
			res.send(err);
		res.json(que);
	});
});


//When userId, subjectId and GradeId are passed
app.get('/getPerformance/:user/:grade/:subject', function(req,res){
	db.quizattempts.aggregate([
	{$match: {"user" : mongojs.ObjectId(req.params.user), "grade" : mongojs.ObjectId(req.params.grade)}},
	{$lookup:{from: "questions", localField: "questionId", foreignField: "_id", as:"questionDetails"}},
	{$unwind: "$questionDetails"},
	{$project: {timeTaken:1, plusMark:1, minusMark:1, score:1, missed:1, _id: 0, subject: "$questionDetails.subject._id"}},
	{$match: {"subject": mongojs.ObjectId(req.params.subject)}},
	{$project: {timeTaken:1, plusMark:1, minusMark:1, score:1, missed:1, _id: 0}},
	{$group: {_id: null, plusMarks: {$sum : "$plusMark"},minusMarks: {$sum : "$minusMark"},totalCorrect: {$sum : "$score"}, totalQuestions: {$sum: 1}, totalMissed: {$sum: "$missed"},totalTime: {$sum: "$timeTaken"}}},
	{$project: {_id: 0, plusMarks:1, minusMarks:1, totalCorrect:1, totalQuestions:1, totalMissed: 1, totalTime:1}}
	],
		function(err, que){
		if(err)
			res.send(err);
		res.json(que[0]);
	});
});


