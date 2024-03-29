const express = require('express'), router = express.Router();
const db = require("../database");
const bcrypt = require("bcrypt");

// Requête GET sur un utilisateur précis
router.get('/:id', (
    req,
    res) => {
    let sql = "select * from user where id = ?";
    let params = [req.params.id];
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
})



// Requête POST de création d'utilisateur
router.post('/', (
    req,
    res) => {
    let errors= []
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

    //console.log(req.body.password)

    let saltRounds = parseInt(process.env.SALT_ROUNDS);
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
            console.log(err)
            res.status(400).json({
                error : "Hash error"
            })
        }

    });
})



// Requête DELETE pour supprimer un utilisateur
router.delete('/:id', (
    req,
    res) => {
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



// Requête PATCH pour modifier un utilisateur
router.patch('/:id', (
    req,
    res) => {

    let saltRounds = parseInt(process.env.SALT_ROUNDS);
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        let data = {
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

module.exports = router;