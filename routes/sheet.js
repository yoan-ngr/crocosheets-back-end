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

    res.send({message:'OK'});
});

router.get('/sheet/:id', (
    req,
    res) => {
    res.send({message:'OK'});
});

router.delete('/sheet/:id', (
    req,
    res) => {
    res.send({message:'OK'});
});


module.exports = router;