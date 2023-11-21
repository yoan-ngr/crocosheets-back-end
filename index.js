const express = require('express');
const { createServer } = require('node:http');

// app est la fonction de rappel créée par Express
const app = express();

const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');

// get config vars
dotenv.config();


var db = require('./database');
var bodyParser = require("body-parser");
var cors = require('cors')
const bcrypt = require("bcrypt");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())


app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

app.get("/api/users", (req, res, next) => {
    var sql = "select * from user"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
    });
});

app.get("/api/user/:id", (req, res, next) => {
    var sql = "select * from user where id = ?"
    var params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":row
        })
    });
});

app.post("/api/user/", (req, res, next) => {
    var errors=[]
    if (!req.body.password){
        errors.push("No password specified");
    }
    if (!req.body.email){
        errors.push("No email specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }

    var saltRounds = 10;
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        var data = {
            name: req.body.name,
            email: req.body.email,
            password : hash
        }
        var sql ='INSERT INTO user (name, email, password) VALUES (?,?,?)'
        var params =[data.name, data.email, data.password]
        db.run(sql, params, function (err, result) {
            if (err){
                res.status(400).json({"error": err.message})
                return;
            }
            res.json({
                "message": "success",
                "data": data,
                "id" : this.lastID
            })
        });
    });

})

app.post("/api/user/auth",(req, res, next) => {
    var errors=[] ;
    var data = {
        email: req.body.email,
        password: req.body.password ? hash : null

    }

    var sql= 'SELECT id FROM user WHERE email = ?' ;

    db.run(sql, data.email, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res1.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    })

    var sql2='SELECT password FROM user WHERE email = ?';

    db.run(sql, res1.json.data, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res2.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    })

    if (res.json.message.equals("succes") && res2.json.message.equals("succes")){

        var sql3='SELECT idToken FROM jwt WHERE idUser = ?';

        db.run(sql3,res1.json.data,function (err, result){
            if(err){
                const token = generateAccessToken({ username: req.body.username });
                res.json(token);
            }
            else {
                var sql4 = 'DELETE FROM jwt WHERE idUser = ?';
                db.run(sql4, res1.json.data, function (err, result) {
                    if (err) {
                        res.status(400).json({"error": err.message})
                        return;
                    }
                    res.json(token);

                })
            }
            var insert = 'INSERT INTO jwt (idUser, data, tokenSecret, expirationTime) VALUES (?,"auth_autorized",' +
                '"09f26e402586e2faa8da4c98a35f1b20d6b033c6097befa8be3486a829587fe2f90a832bd3ff9d42710a4da095a2ce285b009f0c3730cd9b8e1af3eb84df6611","500")'
            db.run(insert,res1.json.data,function (err,result){
                if (err){
                    res.status(400).json({"error": err.message})
                    return;
                }
            })
        })

    }
})

app.patch("/api/user/:id", (req, res, next) => {
    var saltRounds = 10;
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        var data = {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password ? hash : null
        }
        db.run(
            `UPDATE user set 
           name = COALESCE(?,name), 
           email = COALESCE(?,email), 
           password = COALESCE(?,password) 
           WHERE id = ?`,
            [data.name, data.email, data.password, req.params.id],
            function (err, result) {
                if (err) {
                    res.status(400).json({"error": res.message})
                    return;
                }
                res.json({
                    message: "success",
                    data: data,
                    changes: this.changes
                })
            });
    });
})

app.delete("/api/user/:id", (req, res, next) => {
    db.run(
        'DELETE FROM user WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
        });
})

function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

const server = createServer(app);
const port = 3000;

// lancement du serveur avec log du moment où il est prêt
server.listen(port, () => console.log(`Serveur lancé sur http://localhost:${port}`));