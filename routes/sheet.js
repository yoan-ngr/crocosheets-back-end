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



    return router;
}
