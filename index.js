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

app.post("/api/user/", (
    req,
    res, next) => {
    let errors=[]
    if (!req.body.password){
        errors.push("No password specified");
    }
    if (!req.body.email){
        errors.push("No email specified");
    }
    if (!req.body.first_name){
        errors.push("No first name specified");
    }
    if (!req.body.last_name){
        errors.push("No last name specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }

    console.log(req.body.password)

    let saltRounds = 10;
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(!err){
            let data = {
                name: req.body.name,
                email: req.body.email,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                password : hash
            }
            let sql ='INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?,?,?)'
            let params =[data.first_name, data.last_name, data.email, data.password]
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
        }else{
            res.status(400).json({
                error : "Hash error"
            })
        }

    });

})

app.post("/api/user/auth",(
    req,
    res, next) => {

    let errors=[]
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

    console.log(req.body.password)

    let data = {
        email: req.body.email,
        password: req.body.password
    }

    let id
    let password_bdd

    let sql= 'SELECT id,password FROM user WHERE email = ?' ;

    db.get(sql, data.email, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        else if (result === undefined){
            res.status(400).json({"error": "email or password incorrect"})
            return;
        }
        id = result.id
        password_bdd = result.password
        console.log(password_bdd)

        bcrypt.compare(data.password, password_bdd,function(err,result) {
            if(err){
                res.status(400).json({"error": err.message})
                return;
            }
            if(!result) {
                res.status(400).json({"error": "email or password incorrect"})
                return;
            }
            if(result){
                let sql3='SELECT idToken FROM jwt WHERE idUser = ?';

                const token = generateAccessToken({username : req.body.username});
                db.get(sql3,id,function (err, result){
                    if(err){
                        res.status(400).json({"error": err.message})
                        return;
                    }
                    else if(result===""){
                        res.json(token);
                    }
                    else {
                        let sql4 = 'DELETE FROM jwt WHERE idUser = ?';
                        db.run(sql4, id, function (err, result) {
                            if (err) {
                                res.status(400).json({"error": err.message})
                                return;
                            }
                            res.json(token);

                        })
                    }
                    let insert = 'INSERT INTO jwt (idUser, data, tokenSecret, expirationTime) VALUES (?,"auth_autorized", ?,"1800")'
                    db.run(insert,id,token,function (err,result){
                        if (err){
                            res.status(400).json({"error": err.message})
                            return;
                        }
                    })
                })
            }
        });
    })




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