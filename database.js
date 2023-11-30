let sqlite3 = require('sqlite3').verbose()
let bcrypt = require('bcrypt')

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
    }else{
        console.log('Connecté à la base de données SQLite.')

        const saltRounds = 10;

        db.run(`CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name text, 
            last_name text, 
            email text UNIQUE, 
            password text, 
            CONSTRAINT email_unique UNIQUE (email)
            )`,
            (err) => {
                if (err) {
                    // Table already created
                    console.log("Table 'user' déjà existante, réutilisation des données.")
                }else{
                    console.log("Table 'user' créé avec succès.")
                    // Table just created, creating some rows
                    /*let insert = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
                    bcrypt.hash("admin123456", saltRounds, function(err, hash) {
                        // Store hash in your password DB.
                        db.run(insert, ["admin","admin@example.com",hash])
                    });
                    bcrypt.hash("user123456", saltRounds, function(err, hash) {
                        // Store hash in your password DB.
                        db.run(insert, ["user","user@example.com",hash])
                    });*/
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
                    console.log("Table 'jwt' déjà existante, réutilisation des données.")
                }else{
                    console.log("Table 'jwt' créé avec succès.")
                }
            });
        db.run(`CREATE TABLE sheet (
            idSheet INTEGER PRIMARY KEY AUTOINCREMENT,
            nomDocument text,
            dateDeModification date, 
            dateDeCreation date, 
            proprietaire INTEGER,
            FOREIGN KEY (proprietaire) REFERENCES user(id)
            )`,
            (err) => {
                if (err) {
                    // Table already created
                    console.log("Table 'sheet' déjà existante, réutilisation des données.")
                }else{
                    console.log("Table 'sheet' créé avec succès.")
                }
            });
        db.run(`CREATE TABLE participation (
            idSheet INTEGER,
            participant INTEGER,
            FOREIGN KEY (participant) REFERENCES user(id),
            FOREIGN KEY (idSheet) REFERENCES sheet(idSheet),
            PRIMARY KEY (idSheet, participant)
            )`,
            (err) => {
                if (err) {
                    // Table already created
                    console.log("Table 'participation' déjà existante, réutilisation des données.")
                }else{
                    console.log("Table 'participation' créé avec succès.")
                }
            });
    }
});

module.exports = db