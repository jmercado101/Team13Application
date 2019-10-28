//Inital Variables
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

//EXPRESS
//Define Public Dir
app.use(express.static(__dirname + '/public'));
//Server Set Up
var port = 8000
http.listen(port,function(){
    console.log('Server is online' );
});

//SOCKET.IO
io.on('connection', function(socket){
  //On  Connection
    console.log('A user has connected');

  //On Disconnection
    socket.on('disconnect', function(){
  });

  //On Test Event
  socket.emit('server found','it was found');

  //On Search
  socket.on('search database', function(search_key){
		database.query("SELECT title, OnHand, branchName, authorFirst, authorLast, sequence ,publisherName  FROM book as b, inventory as i, branch as br, author as a, publisher as p, wrote as w WHERE (b.title = '" + search_key +"' OR a.authorFirst = '"+search_key+"' OR a.authorLast = '"+search_key+"') AND b.bookCode = i.bookCode and i.branchNum = br.branchNum and b.bookCode = w.bookCode and w.authorNum = a.authorNum and b.publisherCode = p.publisherCode", function (error, results, fields) {
		if (error) throw error;
		console.log(results);
		socket.emit('table result', results);
	});
  });

  //On table request
  socket.on('table request', function(table){
	console.log('Received request for ' + table);
	 database.query('SELECT * FROM ' + table, function (error, results, fields) {
		if (error) throw error;
		console.log(results);
		socket.emit('table result', results);
	});
  });
  //on delete from author
  socket.on('delete author', function(payload){
	var query = "DELETE FROM author where"; //used for building query
	var a = false;//flags
	var b = false;
	var c = false;
	if(payload.authorFirst !== '')//check if element was empty
	{
		query = query.concat(" authorFirst = '" + payload.authorFirst + "'");//query is built using concatenation
		a = true;
	}
	if(payload.authorLast !== '')
	{
		if(a)
			query = query.concat(" AND authorLast = '" + payload.authorLast + "'");
		else
			query = query.concat(" authorLast = '" + payload.authorLast + "'");
		b = true;
	}
	if(payload.authorNum !== '')
	{
		if(a || b)
			query = query.concat(" AND authorNum = '" + payload.authorNum + "'");
		else
			query = query.concat(" authorNum = '" + payload.authorNum + "'");
		c = true;
	}
	if(a || b || c) //if any information was passed, execute the query
	{
		database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
	}
  });
  //socket on add author
  socket.on('add author', function(payload){
	var query = "INSERT INTO author VALUES('" + payload.authorNum + "','"+ payload.authorLast + "','" + payload.authorFirst + "')";//build query, all fields are necessary in add page
		database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
  });
  //socket on update author
  socket.on('update author', function(payload){
	var query1 = "UPDATE author SET ";//build SET clause
	var query2 = "WHERE ";//build WHERE clause
	var a1 = false;
	var a2 = false;
	var b1 = false;
	var b2 = false;
	var c1 = false;
	var c2 = false;
	//same as delete but with more data since it is optional whether some or all of it is filled
	if(payload.authorFirst !== '')
	{
		query2 = query2.concat(" authorFirst = '" + payload.authorFirst + "'");
		a1 = true;
	}
	if(payload.authorLast !== '')
	{
		if(a1)
			query2 = query2.concat(" AND authorLast = '" + payload.authorLast + "'");
		else
			query2 = query2.concat(" authorLast = '" + payload.authorLast + "'");
		b1 = true;
	}
	if(payload.authorNum !== '')
	{
		if(a1 || b1)
			query2 = query2.concat(" AND authorNum = '" + payload.authorNum + "'");
		else
			query2 = query2.concat(" authorNum = '" + payload.authorNum + "'");
		c1 = true;
	}

	if(payload.newauthorFirst !== '')
	{
		query1 = query1.concat(" authorFirst = '" + payload.newauthorFirst + "'");
		a2 = true;
	}
	if(payload.newauthorLast !== '')
	{
		if(a2)
			query1 = query1.concat(" ,authorLast = '" + payload.newauthorLast + "'");
		else
			query1 = query1.concat(" authorLast = '" + payload.newauthorLast + "'");
		b2 = true;
	}
	if(payload.newauthorNum !== '')
	{
		if(a2 || b2)
			query1 = query1.concat(" ,authorNum = '" + payload.newauthorNum + "'");
		else
			query1 = query1.concat(" authorNum = '" + payload.newauthorNum + "'");
		c2 = true;
	}
	query = query1.concat(" " + query2);
	if((a1||b1||c1)&&(a2||b2||c2))//same as delete except one flag from query1 must be true and one flag from query2 must be true Otherwise, the query is not legal
	database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
	
  });
  //Rest of the sockets follow the same logic as the previous ones
  socket.on('delete publisher', function(payload){
	var query = "DELETE FROM publisher where";
	var a = false;
	var b = false;
	var c = false;
	if(payload.publisherCode !== '')
	{
		query = query.concat(" publisherCode = '" + payload.publisherCode + "'");
		a = true;
	}
	if(payload.publisherName !== '')
	{
		if(a)
			query = query.concat(" AND publisherName = '" + payload.publisherName + "'");
		else
			query = query.concat(" publisherName = '" + payload.publisherName + "'");
		b = true;
	}
	if(payload.city !== '')
	{
		if(a || b)
			query = query.concat(" AND city = '" + payload.city + "'");
		else
			query = query.concat(" city = '" + payload.city + "'");
		c = true;
	}
	if(a || b || c)
	{
		database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
	}
  });

   socket.on('add publisher', function(payload){
	var query = "INSERT INTO publisher VALUES('" + payload.publisherCode + "','"+ payload.publisherName + "','" + payload.city + "')";
		database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
  });

    socket.on('update publisher', function(payload){
	var query1 = "UPDATE publisher SET ";
	var query2 = "WHERE ";
	var a1 = false;
	var a2 = false;
	var b1 = false;
	var b2 = false;
	var c1 = false;
	var c2 = false;

	if(payload.publisherCode !== '')
	{
		query2 = query2.concat(" publisherCode = '" + payload.publisherCode + "'");
		a1 = true;
	}
	if(payload.publisherName !== '')
	{
		if(a1)
			query2 = query2.concat(" AND publisherName = '" + payload.publisherName + "'");
		else
			query2 = query2.concat(" publisherName = '" + payload.publisherName + "'");
		b1 = true;
	}
	if(payload.city !== '')
	{
		if(a1 || b1)
			query2 = query2.concat(" AND city = '" + payload.city + "'");
		else
			query2 = query2.concat(" city = '" + payload.city + "'");
		c1 = true;
	}

	if(payload.newpublisherCode !== '')
	{
		query1 = query1.concat(" publisherCode = '" + payload.newpublisherCode + "'");
		a2 = true;
	}
	if(payload.newpublisherName !== '')
	{
		if(a2)
			query1 = query1.concat(" ,publisherName = '" + payload.newpublisherName + "'");
		else
			query1 = query1.concat(" publisherName = '" + payload.newpublisherName + "'");
		b2 = true;
	}
	if(payload.newcity !== '')
	{
		if(a2 || b2)
			query1 = query1.concat(" ,city = '" + payload.newcity + "'");
		else
			query1 = query1.concat(" city = '" + payload.newcity + "'");
		c2 = true;
	}
	query = query1.concat(" " + query2);
	if((a1||b1||c1)&&(a2||b2||c2))
	database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
	
  });

  socket.on('delete book', function(payload){
	var query = "DELETE FROM book where";
	var a = false;
	var b = false;
	var c = false;
	var d = false;
	var e = false;
	if(payload.bookCode !== '')
	{
		query = query.concat(" bookCode = '" + payload.bookCode + "'");
		a = true;
	}
	if(payload.title !== '')
	{
		if(a)
			query = query.concat(" AND title = '" + payload.title + "'");
		else
			query = query.concat(" title = '" + payload.title + "'");
		b = true;
	}
	if(payload.publisherCode !== '')
	{
		if(a || b)
			query = query.concat(" AND publisherCode = '" + payload.publisherCode + "'");
		else
			query = query.concat(" publisherCode = '" + payload.publisherCode + "'");
		c = true;
	}
	if(payload.type !== '')
	{
		if(a || b || c)
			query = query.concat(" AND type = '" + payload.type + "'");
		else
			query = query.concat(" type = '" + payload.type + "'");
		d = true;
	}
	if(payload.paperback !== '')
	{
		if(a || b || c || d)
			query = query.concat(" AND paperback = '" + payload.paperback + "'");
		else
			query = query.concat(" paperback = '" + payload.paperback + "'");
		e = true;
	}
	if(a || b || c || d || e)
	{
		database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
	}
  });

  socket.on('add book', function(payload){
	var query = "INSERT INTO book VALUES('" + payload.bookCode + "','"+ payload.title + "','" + payload.publisherCode + "','" + payload.type + "','" + payload.paperback + "')";
		database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
  });

  socket.on('update book', function(payload){
	var query1 = "UPDATE book SET ";
	var query2 = "WHERE ";
	var a1 = false;
	var b1 = false;
	var c1 = false;
	var d1 = false;
	var e1 = false;
	var a2 = false;
	var b2 = false;
	var c2 = false;
	var d2 = false;
	var e2 = false;
	if(payload.bookCode !== '')
	{
		query2 = query2.concat(" bookCode = '" + payload.bookCode + "'");
		a1 = true;
	}
	if(payload.title !== '')
	{
		if(a1)
			query2 = query2.concat(" AND title = '" + payload.title + "'");
		else
			query2 = query2.concat(" title = '" + payload.title + "'");
		b1 = true;
	}
	if(payload.publisherCode !== '')
	{
		if(a1 || b1)
			query2 = query2.concat(" AND publisherCode = '" + payload.publisherCode + "'");
		else
			query2 = query2.concat(" publisherCode = '" + payload.publisherCode + "'");
		c1 = true;
	}
	if(payload.type !== '')
	{
		if(a1 || b1 || c1)
			query2 = query2.concat(" AND type = '" + payload.type + "'");
		else
			query2 = query2.concat(" type = '" + payload.type + "'");
		d1 = true;
	}
	if(payload.paperback !== '')
	{
		if(a1 || b1 || c1 || d1)
			query2 = query2.concat(" AND paperback = '" + payload.paperback + "'");
		else
			query2 = query2.concat(" paperback = '" + payload.paperback + "'");
		e1 = true;
	}
	
	if(payload.newbookCode !== '')
	{
		query1 = query1.concat(" bookCode = '" + payload.newbookCode + "'");
		a2 = true;
	}
	if(payload.newtitle !== '')
	{
		if(a2)
			query1 = query1.concat(" ,title = '" + payload.newtitle + "'");
		else
			query1 = query1.concat(" title = '" + payload.newtitle + "'");
		b2 = true;
	}
	if(payload.newpublisherCode !== '')
	{
		if(a2 || b2)
			query1 = query1.concat(" ,publisherCode = '" + payload.newpublisherCode + "'");
		else
			query1 = query1.concat(" publisherCode = '" + payload.newpublisherCode + "'");
		c2 = true;
	}
	if(payload.newtype !== '')
	{
		if(a2 || b2 || c2)
			query1 = query1.concat(" ,type = '" + payload.newtype + "'");
		else
			query1 = query1.concat(" type = '" + payload.newtype + "'");
		d2 = true;
	}
	if(payload.newpaperback !== '')
	{
		if(a2 || b2 || c2 || d2)
			query1 = query1.concat(" ,paperback = '" + payload.newpaperback + "'");
		else
			query1 = query1.concat(" paperback = '" + payload.newpaperback + "'");
		e2 = true;
	}

	query = query1.concat(" " + query2);
	if((a1||b1||c1||d1||e1)&&(a2||b2||c2||d2||e2))
	database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});

  });

  socket.on('delete copy', function(payload){
	var query = "DELETE FROM copy where";
	var a = false;
	var b = false;
	var c = false;
	var d = false;
	var e = false;
	if(payload.bookCode !== '')
	{
		query = query.concat(" bookCode = '" + payload.bookCode + "'");
		a = true;
	}
	if(payload.branchNum !== '')
	{
		if(a)
			query = query.concat(" AND branchNum = '" + payload.branchNum + "'");
		else
			query = query.concat(" branchNum = '" + payload.branchNum + "'");
		b = true;
	}
	if(payload.copyNum !== '')
	{
		if(a || b)
			query = query.concat(" AND copyNum = '" + payload.copyNum + "'");
		else
			query = query.concat(" copyNum = '" + payload.copyNum + "'");
		c = true;
	}
	if(payload.quality !== '')
	{
		if(a || b || c)
			query = query.concat(" AND quality = '" + payload.quality + "'");
		else
			query = query.concat(" quality = '" + payload.quality + "'");
		d = true;
	}
	if(payload.price !== '')
	{
		if(a || b || c || d)
			query = query.concat(" AND price = '" + payload.price + "'");
		else
			query = query.concat(" price = '" + payload.price + "'");
		e = true;
	}
	if(a || b || c || d || e)
	{
		database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
	}
  });

  socket.on('add copy', function(payload){
	var query = "INSERT INTO copy VALUES('" + payload.bookCode + "','"+ payload.branchNum + "','" + payload.copyNum + "','" + payload.quality + "'," + payload.price + ")";
		database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});
  });

  socket.on('update copy', function(payload){
	var query1 = "UPDATE copy SET ";
	var query2 = "WHERE ";
	var a1 = false;
	var b1 = false;
	var c1 = false;
	var d1 = false;
	var e1 = false;
	var a2 = false;
	var b2 = false;
	var c2 = false;
	var d2 = false;
	var e2 = false;
	if(payload.bookCode !== '')
	{
		query2 = query2.concat(" bookCode = '" + payload.bookCode + "'");
		a1 = true;
	}
	if(payload.branchNum !== '')
	{
		if(a1)
			query2 = query2.concat(" AND branchNum = '" + payload.branchNum + "'");
		else
			query2 = query2.concat(" branchNum = '" + payload.branchNum + "'");
		b1 = true;
	}
	if(payload.copyNum !== '')
	{
		if(a1 || b1)
			query2 = query2.concat(" AND copyNum = '" + payload.copyNum + "'");
		else
			query2 = query2.concat(" copyNum = '" + payload.copyNum + "'");
		c1 = true;
	}
	if(payload.quality !== '')
	{
		if(a1 || b1 || c1)
			query2 = query2.concat(" AND quality = '" + payload.quality + "'");
		else
			query2 = query2.concat(" quality = '" + payload.quality + "'");
		d1 = true;
	}
	if(payload.price !== '')
	{
		if(a1 || b1 || c1 || d1)
			query2 = query2.concat(" AND price = '" + payload.price + "'");
		else
			query2 = query2.concat(" price = '" + payload.price + "'");
		e1 = true;
	}
	
	if(payload.newbookCode !== '')
	{
		query1 = query1.concat(" bookCode = '" + payload.newbookCode + "'");
		a2 = true;
	}
	if(payload.newbranchNum !== '')
	{
		if(a2)
			query1 = query1.concat(" ,branchNum = '" + payload.newbranchNum + "'");
		else
			query1 = query1.concat(" branchNum = '" + payload.newbranchNum + "'");
		b2 = true;
	}
	if(payload.newcopyNum !== '')
	{
		if(a2 || b2)
			query1 = query1.concat(" ,copyNum = '" + payload.newcopyNum + "'");
		else
			query1 = query1.concat(" copyNum = '" + payload.newcopyNum + "'");
		c2 = true;
	}
	if(payload.newquality !== '')
	{
		if(a2 || b2 || c2 )
			query1 = query1.concat(" ,quality = '" + payload.newquality + "'");
		else
			query1 = query1.concat(" quality = '" + payload.newquality + "'");
		d2 = true;
	}
	if(payload.newprice !== '')
	{
		if(a2 || b2 || c2 || d2)
			query1 = query1.concat(" ,price = '" + payload.newprice + "'");
		else
			query1 = query1.concat(" price = '" + payload.newprice + "'");
		e2 = true;
	}
	query = query1.concat(" " + query2);
	if((a1||b1||c1||d1||e1)&&(a2||b2||c2||d2||e2))
	database.query(query, function (error, results, fields) {
			if (error) throw error;
			console.log(results);
			socket.emit('table result', results);
			});

  });

});
//database connection
var database = require('./database.js');