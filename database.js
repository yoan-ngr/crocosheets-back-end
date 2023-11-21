var sqlite3 = require('sqlite3').verbose()
var bcrypt = require('bcrypt')

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
    }else{
        console.log('Connected to the SQLite database.')

        const saltRounds = 10;

        db.run(`CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text, 
            email text UNIQUE, 
            password text, 
            CONSTRAINT email_unique UNIQUE (email)
            )`,
            (err) => {
                if (err) {
                    // Table already created
                }else{
                    // Table just created, creating some rows
                    var insert = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
                    bcrypt.hash("admin123456", saltRounds, function(err, hash) {
                        // Store hash in your password DB.
                        db.run(insert, ["admin","admin@example.com",hash])
                    });
                    bcrypt.hash("user123456", saltRounds, function(err, hash) {
                        // Store hash in your password DB.
                        db.run(insert, ["user","user@example.com",hash])
                    });
                }
            });
        db.run(`CREATE TABLE jwt (
            idToken INTEGER PRIMARY KEY AUTOINCREMENT,
            idUser INTEGER,
            data text, 
            tokenSecret text, 
            expirationTime number,
            FOREIGN KEY (idUser) REFERENCES user(id)
            )`,
            (err) => {
                if (err) {
                    // Table already created
                }
            })
    }
});

module.exports = db