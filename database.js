var mysql      = require('mysql');
var connection = mysql.createConnection({
  //change to work on your host
  host     : 'localhost', 
  user     : 'root', 
  password : 'Sonic@2000', 
  database : 'henrybooks' 
});
connection.connect();
module.exports = connection;