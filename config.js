var config = {};

//secret key to authenticate user to access Admin Panel
config.secret = 'SECRET';

//mongo database
config.mongo = {};
config.mongo.uri = 'mongodb://localhost/ProdDb';
config.mongo.db = 'ProdDb';

//Port to run the server
config.port = 5000;

module.exports = config;