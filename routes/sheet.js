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

router.get('/sheet/:id', (
    req,
    res) => {
    res.send({message:'OK'});
});

router.delete('/:id', (
    req,
    res) => {
    db.run(
        'DELETE FROM sheet WHERE idSheet = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"sheet correctly deleted", changes: this.changes})
        });
});


module.exports = router;