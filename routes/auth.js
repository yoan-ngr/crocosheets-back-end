const express = require('express'), router = express.Router();
const db = require("../database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post('/login', (
    req,
    res) => {
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

    //console.log(req.body.password)

    let data = {
        email: req.body.email,
        password: req.body.password
    }

    let id
    let password_bdd

    let sql= 'SELECT * FROM user WHERE email = ?' ;

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
        let first_name = result.first_name
        let last_name = result.last_name
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

                            res.json({
                                id : id,
                                token : token,
                                first_name : first_name,
                                last_name: last_name,
                            });

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

function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

module.exports = router;