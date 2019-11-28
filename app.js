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
http.listen(port, function () {
    console.log('Server is online');
});

//SOCKET.IO
io.on('connection', function (socket) {
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
    socket.on('addToCart', function (bookData, token) {
        if (bookData != null && checkToken(token, bookData.userID)) {
            database.query("SELECT * FROM cart WHERE userID = " + bookData.userID + " AND ISBN = " + bookData.ISBN, function (error, quantity, fields) {
                if (error) {
                    console.error(error);
                }
                else {
                    if (quantity[0] != null) {
                        console.log("Book already in cart.");
                    }
                    else {
                        console.log("Adding book to cart.")
                        var query = "INSERT INTO cart VALUES ('" + bookData.userID + "','" + bookData.ISBN + "','1')";
                        database.query(query, function (error, results, fields) {
                            if (error) {
                                console.error(error);
                            }
                            else {
                                console.log("done");
                            }
                        });
                    }
                }
            });
        }
        else {
            console.error("ERROR: bookData == null");
        }

    });

    //add item quantity in cart
    socket.on('incrementQuantity', function (userID, ISBN, token) {
        if (userID != null && ISBN != null && checkToken(token, userID)) {
            database.query("SELECT * FROM cart WHERE userID = " + userID + " AND ISBN = " + ISBN, function (error, quantity, fields) {
                if (error) {
                    console.error(error);
                }
                else {
                    if (quantity[0] != null) {
                        console.log("Incrementing book in cart.")
                        database.query("UPDATE cart SET quantity = cart.quantity + 1 WHERE userID = '" + userID + "' AND ISBN = '" + ISBN + "';", function (error, quantity, fields) {
                            if (error) {
                                console.error(error);
                            }
                            else {
                                console.log("done");
                            }
                        });
                    }
                    else {
                        console.log("Book not in cart");
                    }
                }
            });
        }
        else {
            console.log("Error: userID or ISBN == null");
        }
    });

    //subtract item quantity in cart
    socket.on('decrementQuantity', function (userID, ISBN, token) {
        if (userID != null && ISBN != null && checkToken(token, userID)) {
            database.query("SELECT quantity FROM cart WHERE userID = '" + userID + "' AND ISBN = '" + ISBN + "';", function (error, quantity, fields) {
                if (quantity[0] != null && quantity[0].quantity <= 1) {
                    database.query("DELETE FROM cart WHERE userID = '" + userID + "' AND ISBN = '" + ISBN + "';");
                    console.log("Deleteing book: " + ISBN + " from cart: " + userID);
                }
                else {
                    database.query("UPDATE cart SET quantity = cart.quantity - 1 WHERE userID = '" + userID + "' AND ISBN = '" + ISBN + "';", function (error, quantity, fields) {
                        if (error) {
                            console.error(error);
                        }
                        else {
                            console.log("done");
                        }
                    });
                }
            });
            
        }
        else {
            console.log("Error: userID or ISBN == null");
        }
    });

    //Remove book from cart
    socket.on('removeBook', function (userID, ISBN, token) {
        if (userID != null && ISBN != null && checkToken(token, userID)) {
            database.query("DELETE FROM cart WHERE userID = '" + userID + "' AND ISBN = '" + ISBN + "';");
            console.log("Deleteing book: " + ISBN + " from cart: " + userID);
        }
        else {
            console.log("Error: userID or ISBN == null or token invalid.");
        }
    });

    //clears cart for given userID
    socket.on('clearCart', function (userID, token) {
        if (userID != null && checkToken(token, userID)) {
            database.query("DELETE FROM cart WHERE userID = '" + userID + "'", function (error, rating, fields) {
                if (error) {
                    console.error(error);
                }
                else {
                    console.log("done");
                }
            })
        }
        else {
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

    socket.on('purchased', function (ISBN, ID, token) {
        if (checkToken(ID, token)) {
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

    //Add User to DB
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
                });
                payload.log = "true";
                socket.emit('userResult', payload);
            }
        })
    });
    
    //Edits the User's email
    socket.on('editEmail', function (payload) {
        var checkHome = "SELECT * FROM users WHERE (email = '" + payload.email + "')";
        database.query(checkHome, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('emailResult', payload);
            }
            if (results.length) {
                console.log("The email is already taken");
                payload.log = "false";
                socket.emit('emailResult', payload);
            }
            else {
                console.log("Replacing the email");
                var query = "UPDATE users SET email = '" + payload.email + "' WHERE ID = '" + payload.ID + "'";//build query, all fields are necessary in add page		
                database.query(query, function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                });
                payload.log = "true";
                socket.emit('emailResult', payload);
            }
        })
    });
    
    //Edits the User's Nickname
    socket.on('editNickname', function (payload) {
        var checkHome = "SELECT * FROM users WHERE (nickname = '" + payload.nickname + "')";
        database.query(checkHome, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('nicknameResult', payload);
            }
            if (results.length) {
                console.log("The nickname is already taken");
                payload.log = "false";
                socket.emit('nicknameResult', payload);
            }
            else {
                console.log("Replacing the nickname");
                var query = "UPDATE users SET nickname = '" + payload.nickname + "' WHERE ID = '" + payload.ID + "'";//build query, all fields are necessary in add page		
                database.query(query, function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                });
                payload.log = "true";
                socket.emit('nicknameResult', payload);
            }
        })
    });
    
    //Edits the User's Name
    socket.on('editName', function (payload) {
        console.log("Replacing the full name");
        var query = "UPDATE users SET fName = '" + payload.fName + "', lName = '" + payload.lName + "' WHERE ID = '" + payload.ID + "'";//build query, all fields are necessary in add page		
        database.query(query, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
        });
        payload.log = "true";
        socket.emit('nameResult', payload);
    });
    
    //Edits the User's Password
    socket.on('editPassword', function (payload) {
        console.log("Replacing the full name");
        var newPassword = hashPassword(payload.password);
        var query = "UPDATE users SET passwd = '" + newPassword + "' WHERE ID = '" + payload.ID + "'";//build query, all fields are necessary in add page		
        database.query(query, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
        });
        payload.log = "true";
        socket.emit('passwordResult', payload);
    });

    //Adds Credit Card
    socket.on('addCredit', function (payload) {
        var checkDuplicate = "SELECT * FROM credit_card WHERE (credit_card.cardNum = '" + payload.cardNum + "'AND credit_card.userID = '" + payload.ID + "')";
        database.query(checkDuplicate, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('creditResult', payload);
            }
            if (results.length) {
                console.log("Credit Card is already listed");
                payload.log = "false";
                socket.emit('creditResult', payload);
            }
            else {
                console.log("The credit card will be registered");
                var query = "INSERT INTO credit_card (userID, cardNum, nameOnCard, cvv, exp_date, zipCode) VALUES('" + payload.ID + "','" + payload.cardNum + "','" + payload.nameOnCard + "','" + payload.cvv + "','" + payload.exp_date + "','" + payload.zipCode + "')";//build query, all fields are necessary in add page		
                database.query(query, function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                });
                payload.log = "true";
                socket.emit('creditResult', payload);
            }
        })
    });

    //Get Credit Card
    socket.on('getCard', function (payload) {
        var checkCard = "SELECT cardNum FROM credit_card WHERE (userID = '" + payload.ID + "')";
        database.query(checkCard, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('getCredit', payload);
            }
            if (results.length) {
                console.log("Credit Card will be listed");
                payload.log = "true";
                socket.emit('getCredit', results);
            }
            else {
                console.log("There are no cards");
                payload.log = "false";
                socket.emit('getCredit', payload);
            }
        })
    });
    
    //Deletes a Credit Card
    socket.on('delCredit', function (payload) {
        payload.log = "false";
        var check = "SELECT * FROM credit_card WHERE (userID = '" + payload.ID + "'AND cardNum ='" + payload.cardNum + "')";
        database.query(check, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('cardResult', payload);
            }
            if (results.length) {
                console.log("Removing Credit Card");
                var delHome = "DELETE FROM credit_card WHERE (userID = '" + payload.ID  + "'AND cardNum ='" + payload.cardNum + "')";
                database.query(delHome, function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                });
                payload.log = "true";
                socket.emit('cardResult', payload);
            }
            socket.emit('cardResult', payload);
        })
    });
    
    //Deletes an Address
    socket.on('delAddress', function (payload) {
        payload.log = "false";
        var check = "SELECT * FROM address WHERE (userID = '" + payload.ID + "'AND street_address ='" + payload.street_address + "'AND isHome = '" + payload.isHome + "')";
        database.query(check, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('addressResult', payload);
            }
            if (results.length) {
                console.log("Removing Address");
                var delHome = "DELETE FROM address WHERE (userID = '" + payload.ID + "'AND street_address ='" + payload.street_address + "'AND isHome = '" + payload.isHome + "')";
                database.query(delHome, function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                });
                payload.log = "true";
            }
            socket.emit('addressResult', payload);
        })
    });

    //Adds an address
    socket.on('addAddress', function (payload) {
        if (payload.isHome == 1) {
            var checkHome = "SELECT * FROM address WHERE (userID = '" + payload.ID + "'AND isHome ='" + payload.isHome + "')";
            database.query(checkHome, function (error, results, fields) {
                if (error) {
                    console.log("An error has occurred");
                    payload.log = "false";
                    socket.emit('addressResult', payload);
                }
                if (results.length) {
                    console.log("Removing old Home address");
                    var delHome = "DELETE FROM address WHERE (userID = '" + payload.ID + "'AND isHome ='" + payload.isHome + "')";
                    database.query(delHome, function (error, results, fields) {
                        if (error) throw error;
                        console.log(results);
                    });
                    payload.log = "false";
                }
                console.log("The address will be registered");
                var query = "INSERT INTO address (userID, isHome, name, street_address, city, state, zip_code, country) VALUES('" + payload.ID + "','" + payload.isHome + "','" + payload.name + "','" + payload.street_address + "','" + payload.city + "','" + payload.state + "','" + payload.zip_code + "','" + payload.country + "')";//build query, all fields are necessary in add page		
                database.query(query, function (error, results, fields) {
                    if (error) throw error;
                    console.log(results);
                });
                payload.log = "true";
                socket.emit('addressResult', payload);
            })
        }
        else {
            var checkDuplicate = "SELECT * FROM address WHERE (userID = '" + payload.ID + "'AND street_address = '" + payload.street_address + "')";
            database.query(checkDuplicate, function (error, results, fields) {
                if (error) {
                    console.log("An error has occurred");
                    payload.log = "false";
                    socket.emit('addressResult', payload);
                }
                if (results.length) {
                    console.log("Address is already listed");
                    payload.log = "false";
                    socket.emit('addressResult', payload);
                }
                else {
                    console.log("The address will be registered");
                    var query = "INSERT INTO address (userID, isHome, name, street_address, city, state, zip_code, country) VALUES('" + payload.ID + "','" + payload.isHome + "','" + payload.name + "','" + payload.street_address + "','" + payload.city + "','" + payload.state + "','" + payload.zip_code + "','" + payload.country + "')";//build query, all fields are necessary in add page		
                    database.query(query, function (error, results, fields) {
                        if (error) throw error;
                        console.log(results);
                    });
                    payload.log = "true";
                    socket.emit('addressResult', payload);
                }
            })
        }
    });
    
    //Get Shipping Addresses
    socket.on('getShipping', function (payload) {
        var checkCard = "SELECT street_address FROM address WHERE (userID = '" + payload.ID + "')";
        database.query(checkCard, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('getAddress', payload);
            }
            if (results.length) {
                console.log("Shipping Adresses will be listed");
                payload.log = "true";
                socket.emit('getAddress', results);
            }
            else {
                console.log("There are no shipping addresses");
                payload.log = "false";
                socket.emit('getAddress', payload);
            }
        })
    });
    
    //Get Home Address
    socket.on('Home', function (payload) {
        var checkCard = "SELECT street_address FROM address WHERE (userID = '" + payload.ID + "'AND isHome = '" + 1 + "')";
        database.query(checkCard, function (error, results, fields) {
            if (error) {
                console.log("An error has occurred");
                payload.log = "false";
                socket.emit('getHome', payload);
            }
            if (results.length) {
                console.log("Shipping Adresses will be listed");
                payload.log = "true";
                socket.emit('getHome', results);
            }
            else {
                console.log("There are no shipping addresses");
                payload.log = "false";
                socket.emit('getHome', payload);
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

    socket.on('checkRating', function (userID, ISBN) {
        if (userID != null || ISBN != null) {
            var query = "SELECT * FROM ratings WHERE userID = '" + userID + "'";
            database.query(query, function (error, rating, fields) {
                if (error) {
                    console.error('Bad query on RATINGCHECK: ' + error);
                }
                else {
                    if (rating[0] != null) {
                        console.log("Duplicate review restriction:");
                        console.log("Comment on " + ISBN + " already exists.");
                        socket.emit("reviewExists", true);
                    }
                }
            });
        }
    });

    //End NEW

    //author search
    socket.on('author search', function (author_ID) {
        database.query("SELECT title, genere, coverURL, price, descript, stars FROM books as b, ratings as r, author as a WHERE b.author_ID = '" + author_ID + "' AND a.author = b.author_ID and b.ISBN = r.ISBN ", function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            socket.emit('table result', results);
        });
    });

    //On Search
    socket.on('search database', function (search_key) {
        database.query("SELECT title, fName, lName ,publisher, genere, coverURL, price, descript, comments, stars FROM books as b, ratings as r, author as a WHERE (b.title = '" + search_key + "' OR a.fName = '" + search_key + "' OR a.lName = '" + search_key + "' OR b.genere = '" + search_key + "') AND b.author_ID = a.author and b.ISBN = r.ISBN", function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            socket.emit('table result', results);
        });
    });

    //On table request
    socket.on('table request', function (table) {
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
                if (error || users[0] == null) {
                    console.error(error);
                    socket.emit('authenticated', "invalidLogin", null);
                }
                else {
                    if (hashPassword(password) == users[0].passwd) {
                        console.log("Success!")
                        socket.emit('allInfo', users[0].nickname, users[0].fName, users[0].lName, users[0].ID);
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
    function checkToken(providedToken, userID) {
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
