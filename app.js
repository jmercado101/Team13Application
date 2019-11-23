//Inital Variables
var express = require('express');
var app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
var path = require('path');

//EXPRESS
//Define Public Dir
app.use(express.static(__dirname + '/public'));
//Server Set Up
var port = 80
http.listen(port,function(){
    console.log('Server is online');
});

//SOCKET.IO
io.on('connection', function(socket){
  //On  Connection
    console.log('A user has connected');

  //On Disconnection
    socket.on('disconnect', function () {
    });

    //On Test Event
    socket.emit('server found', 'it was found');


    //NEW CODE Book Details
    socket.on('bookDetails', function (ISBN) {
        if (ISBN != null) {
            database.query("SELECT books.ISBN, title, genere, coverURL, price, publisher, descript, concat(fName, \" \", lName) AS authorName, bio, author_ID FROM books JOIN author ON author = author_ID WHERE ISBN = '" + ISBN + "'", function (error, results, fields) {
                if (error) {
                    console.error(error);
                }
                else {
                    console.log(results);
                    socket.emit('detailsResult', results[0]);
                }
            });
        }
        else {
            console.error("ERROR: bookDetails: ISBN == null");
        }
        
    });
	
	//Query to get details from cart
	socket.on('getCart', function (userID) {
        if (userID != null) {	
		database.query("Select c.userID, c.ISBN, c.quantity, b.coverURL, b.price, b.title From cart as c join books as b on c.ISBN = b.ISBN Where userID = " + userID + ";", function (error, results, fields) {
                if (error) {
                    console.error(error);
                }
                else {
                    console.log(results);
                    socket.emit('cartDetails', results);
                }
            });
        }
        else {
            console.error("ERROR: getCart: userID == null");
        }
	});
	
    //query to add to cart in databse
	socket.on('addToCart', function (bookData){
		if(bookData != null){
			var query = "INSERT INTO cart VALUES ('" + bookData.userID + "','" + bookData.ISBN + "','1')";
			database.query(query, function (error, results, fields){
				if (error){
					console.error(error);
				}
				else{
					console.log("done");
				}
			});
		}
		else{
			console.error("ERROR: bookData == null");
		}
		
	});

	//add item quantity in cart
	socket.on('incrementQuantity', function(userID, ISBN){
		if(userID != null && ISBN != null ){
			database.query("UPDATE cart SET quantity = cart.quantity + 1 WHERE userID = '" + userID + "' AND ISBN = '"+ ISBN + "';");
			if (error){
				console.error(error);
			}
			else{
				console.log("done");
			}
		}
		else{
			console.log("Error: userID or ISBN == null");
		}
	});

	//subtract item quantity in cart
	socket.on('decrementQuantity', function(userID, ISBN){
		if(userID != null && ISBN != null ){
			database.query("UPDATE cart SET quantity = cart.quantity - 1 WHERE userID = '" + userID + "' AND ISBN = '"+ ISBN + "';");
			if (error){
				console.error(error);
			}
			else{
				console.log("done");
			}
		}
		else{
			console.log("Error: userID or ISBN == null");
		}
	});

	//clears cart for given userID
	socket.on('clearCart', function(userID){
		if(userID !=null){
			database.query("DELETE FROM cart WHERE userID = '" + userID + "'", function(error, rating, fields){
				if(error){
					console.error(error);
				}
				else{
					console.log("done");
				}
			})
		}
		else{
			console.log("Error: userID == null");
		}
		
	});

    socket.on('bookRating', function (ISBN) {
        if (ISBN != null) {
            database.query("SELECT AVG(stars) AS rating FROM ratings WHERE ISBN = " + ISBN, function (error, rating, fields) {
                if (error) {
                    console.error(error);
                }
                else {
                    if (rating[0].rating != null) {
                        console.log(rating);
                        socket.emit('ratingResult', rating[0].rating.toFixed(1));
                    }
                    else {
                        console.log("NOTE: bookRating: No ratings yet.  Book rating returned as 0.");
                        socket.emit('ratingResult', 0);
                    }
                }
            });
        }
        else {
            console.error("ERROR: bookRating: ISBN == null");
        }
    });

    socket.on('testFunction', function (comment) {
        console.log("testFunctionSays: " + comment);
    });

    socket.on('purchased', function (ISBN, ID) {
        if (ISBN != null && ID != null) {
            database.query("SELECT count(*) AS count FROM purchased WHERE EXISTS (SELECT * FROM purchased WHERE purchased.ID = " + ID + " AND purchased.ISBN = " + ISBN + ")", function (error, purchased, fields) {
                if (error) {
                    console.error(error);
                }
                else {
                    console.log('Book purchased: ' + purchased[0].count);
                    socket.emit('wasPurchased', purchased[0].count);
                }
            });
        }
        else {
            console.error("ERROR: purchased: ISBN or ID == null");
        }
    });

    socket.on('comments', function (ISBN) {
        var maxComments = 100;
        if (ISBN != null) {
            database.query("SELECT nickname, anonymity, comments, stars FROM ratings INNER JOIN users ON userID = ID WHERE ISBN =" + ISBN + " LIMIT 0, " + maxComments, function (error, comments, fields) {
                if (error) {
                    console.error(error);
                }
                else {
                    for (i in comments) {
                        if (comments[i].anonymity == 1) {
                            console.log("User requested anonymity.\nHiding name: " + comments[i].nickname);
                            comments[i].nickname = "Anonymous";
                        }
                    }
                    console.log(comments);
                    socket.emit('gotComments', comments);
                }
            });
        }
        else {
            console.error("ERROR: comments: ISBN == null");
        }
    });

    // END NEW CODE
		
     socket.on('addUser', function (payload) {
         var checkDuplicate = "SELECT * FROM users WHERE (users.email = '" + payload.email.toLowerCase() + "'OR users.nickname = '" + payload.nickname + "')";
        database.query(checkDuplicate, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('userResult', payload);
            }
            if (results.length) {
                console.log("Username or Email taken");
                payload.log = "false";
                socket.emit('userResult', payload);
            }
            else {
                console.log("The username and email will be registered");
                var query = "INSERT INTO users (fName, lName, email, nickname, passwd) VALUES('" + payload.fName + "','" + payload.lName + "','" + payload.email.toLowerCase() + "','" + payload.nickname + "','" + hashPassword(payload.passwd) + "')";//build query, all fields are necessary in add page		
                database.query(query, function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                    socket.emit('table result', results);
                });
                payload.log = "true";
                socket.emit('userResult', payload);
            }
        })
    });
	
    //socket on add ratings NEW
    socket.on('addRatings', function (token, payload) {
        var userID = payload.user_id;
        if (checkToken(token, userID)) {
            var query = "INSERT INTO ratings VALUES('" + payload.ISBN + "','" + payload.user_id + "','" + payload.comment + "', '" + payload.rate + "', '" + payload.anonymity + "')"; //build query, all fields are necessary in add page
            database.query(query, function (error, results, fields) {
                if (error) {
                    console.error('Bad query on RATING: ' + error);
                    console.log("Comment on " + payload.ISBN + " failed.");
                }
                else {
                    console.log("Added Comment to: " + payload.ISBN);
                }
                console.log(results);
            });
        }
        else {
            console.error("Invalid token from 'user': " + userID);
        }
    });
    //End NEW

    //author search
	socket.on('author search', function(author_ID){
		database.query("SELECT title, genere, coverURL, price, descript, stars FROM books as b, ratings as r, author as a WHERE b.author_ID = '"+author_ID+"' AND a.author = b.author_ID and b.ISBN = r.ISBN ", function (error, results, fields){
			if(error) throw error;
			console.log(results);
			socket.emit('table result', results);
		});
	});

    //On Search
    socket.on('search database', function(search_key){
		database.query("SELECT title, fName, lName ,publisher, genere, coverURL, price, descript, comments, stars FROM books as b, ratings as r, author as a WHERE (b.title = '" + search_key +"' OR a.fName = '"+search_key+"' OR a.lName = '"+search_key+"' OR b.genere = '"+search_key+"') AND b.author_ID = a.author and b.ISBN = r.ISBN", function (error, results, fields) {
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

    //Login check
    socket.on('signIn', function (email, password) {
        email = email.toLowerCase();
        if (email != null && password != null) {
            console.log('Attemted sign in from: ' + email);
            console.log(password)
            database.query("SELECT * FROM users WHERE email = '" + email + "'", function (error, users, fields) {
                if(error || users[0] == null)
                {
                    console.error(error);
                }
                else
                {
                    if (hashPassword(password) == users[0].passwd) {
                        console.log("Success!")
                        socket.emit('allInfo', users[0].nickname, users[0].fName, users[0].lName);
                        socket.emit('authenticated', generateToken(users[0].passwd, users[0].email, users[0].ID), users[0].ID);
                    }
                    else {
                        console.log("Failure.  Invalid Login.")

                        console.log("Password mismatch:");
                        console.log(hashPassword(password));
                        console.log(users[0].passwd);
                        socket.emit('authenticated', "invalidLogin", null);
                    }
                }
                
            });
        }
    });

    function generateToken(hashedPassword, email, userID) {
        return crypto.createHash('sha512').update(hashedPassword + email.toLowerCase() + userID).digest('hex');
    }
    function hashPassword(inPassword) {
        return crypto.createHash('sha512').update(inPassword).digest('hex');
    }
    function checkToken(providedToken, userID)
    {
        if (providedToken != null && userID != null) {
            return database.query("SELECT * FROM users WHERE ID = '" + userID + "'", function (error, user, fields) {
                if (error) {
                    console.error(error);
                    return false;
                }
                else {
                    var knownGoodToken = generateToken(user[0].passwd, user[0].email, user[0].ID);
                    if (providedToken == knownGoodToken) {
                        console.log("User " + userID + " authenticated.");
                        return true;
                    }
                }
            });
        }
    }
 

});
//database connection
var database = require('./database.js');
