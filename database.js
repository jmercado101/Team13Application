var mysql      = require('mysql');
var connection = mysql.createConnection({
  //change to work on your host
    host: '73.125.137.185', 
    user: 'devuser', 
    password: '1337DbPw', 
    database: 'TestDB' 
});
connection.connect();
module.exports = connection;