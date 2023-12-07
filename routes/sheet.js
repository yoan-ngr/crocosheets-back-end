const db = require("../database");
module.exports = function (io) {

    const express = require('express'), router = express.Router();
    const db = require("../database");

    router.post('/', (
        req,
        res) => {


        let data = {
            proprietaire: req.body.proprietaire
        }

        let sql= 'INSERT INTO sheet(nomDocument, dateDeModification, dateDeCreation, proprietaire) VALUES ("Sheet !", datetime(), datetime(), ? )' ;

        db.run(sql, data.proprietaire, function (err, result) {
            if (err) {
                //res.status(400).json({"error": err.message})
                console.log(err)
            }
        })

        sql= 'SELECT MAX(idsheet) AS maxSheet FROM sheet' ;

        db.get(sql, function (err, result) {
            if (err) {
                res.status(400).json({"error": err.message})
                console.log(err)
            }else{
                console.log(result)
                res.send({message:'OK', data : result});
                return res;
            }
        })


    });

    router.get('/:id', (
        req,
        res) => {
        let params = [req.params.id];
        let sql = "select * from sheet where idSheet = ?";
        db.get(sql,params,(err, row)=>{
            if (err) {
                res.status(400).json({"error":err.message});
                return;
            }
            if (row===undefined) {
                res.status(404).json({"error" : "No sheet"});
                return;
            }
            res.json({
                "message":"success",
                "data":row
            })

        });

    });

    router.get('/:id/members',(req,res) => {

        let sql = 'Select distinct id,first_name, last_name, email from participation natural join user where idSheet = ? and participant = id;'

        db.all(sql,req.params.id,function (err,row){
            if (err){
                res.status(400).json({"error":err.message});
                return;
            }
            res.json({
                "message":"success",
                "data":row,
            })
        });
    })

    router.get('/:id/notmembers',(req,res) => {

        let sql = 'Select distinct id,first_name, last_name, email from participation natural join user where not idSheet = ?;'

        db.all(sql,req.params.id,function (err,row){
            if (err){
                res.status(400).json({"error":err.message});
                return;
            }
            res.json({
                "message":"success",
                "data":row,
            })
        });
    })

    router.post('/adduser/:id',(req,res) => {

        let errors = [];

        if (!req.body.idUser){
            errors.push("No idUser specified");
        }
        if (errors.length){
            res.status(400).json({"error":errors.join(",")});
            return;
        }

        let sql = 'Insert into participation (idSheet,participant) VALUES (?,?);'
        db.run(sql,[req.params.id,req.body.idUser],function(err,row) {
            if (err){
                res.status(400).json({"error":err.message});
                return;
            }
            res.json({
                "message":"success"
            })
        });

    });

    router.delete('/:id/user/:iduser',(req,res)=>{

        let sql = 'Delete from participation where idSheet = ? and participant = ? ;'
        db.run(sql,[req.params.id,req.params.iduser],function(err,row) {
            if (err){
                res.status(400).json({"error":err.message});
                return;
            }
            res.json({
                "message":"success"
            })
        });

    })

    router.post('/checkuser/:id',(req,res)=>{

        let errors =[];

        if (!req.body.idUser){
            errors.push("No idUser specified");
        }
        if (errors.length){
            res.status(400).json({"error":errors.join(",")});
            return;
        }
        let sql ='Select * from participation where participant = ? and idSheet = ?;'
        db.get(sql,[req.body.idUser,req.params.id],function(err,row){
            if (err){
                res.status(400).json({'error':err.message});
                return;
            }
            console.log(row);
            if (row===undefined) {

                let sql ='Select * from sheet where proprietaire = ? and idSheet = ?;'
                db.get(sql,[req.body.idUser,req.params.id],function(err,row2) {
                    if (err) {
                        res.status(400).json({'error': err.message});
                        return;
                    }
                    if(row2===undefined){
                        res.status(403).json({"error": "Don't participe in this sheet"});
                        return;
                    }
                    res.json({
                        "message":"success",
                    })
                });
            }
            else {
                res.json({
                    "message":"success",
                })
            }
        })}
    );

    router.delete('/:id', (
        req,
        res) => {
        db.run(
            'DELETE FROM sheet WHERE idSheet = ?',
            req.params.id,
            function (err, result) {
                if (err){
                    res.status(400).json({"error": err.message})
                    return;
                }
                res.json({"message":"sheet correctly deleted"})
            });
    });

    router.patch('/:id',(req,res) => {

        let errors =[];

        if (!req.body.newName){
            errors.push("No newName specified");
        }
        if (errors.length){
            res.status(400).json({"error":errors.join(",")});
            return;
        }

        let newName = req.body.newName;

        let sql = 'UPDATE sheet SET nomDocument = ? WHERE idSheet = ?';
        db.run(sql,[newName,req.params.id],function (err,result){
            if (err){
                res.status(400).json({"error": err.message})
                return;
            }
            res.json({"message":"nom modifié"});
        })
    })



    return router;
}
