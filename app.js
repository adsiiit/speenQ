var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
//var passport = require('passport');

var morgan  = require('morgan');

var path = require('path');

//app.use(express.static(__dirname+'/client'));
//app.use(passport.initialize());

//to create json document
app.use(bodyParser.json());


User = require('./models/user');
Quizattempt = require('./models/quizattempt')
QContactList = require('./models/qContactList')
QFriendList = require('./models/qFriendList')
QInvitation = require('./models/qInvitation')
QNewGame = require('./models/qNewGame')


/*require('./config/passport');*/
var config = require('./config');

//Connect to Mongoose
mongoose.connect(config.mongo.uri);

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));

// use morgan to log requests to the console
app.use(morgan('dev'));

//ROUTES FOR QUIZ  -- START
var quiz = require('./routes/quiz');
// ROUTES FOR QUIZ --END

app.use('/api', quiz);


app.listen(config.port);
console.log('Running on  port '+config.port+' ...');