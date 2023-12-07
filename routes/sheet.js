const db = require("../database");
module.exports = function (io) {

    const express = require('express'), router = express.Router();
    const db = require("../database");

    let users = new Map();
    let tableau = null;
    const colors = ['green', 'red', 'pink', 'yellow', 'purple', 'blue']

    router.post('/', (
        req,
        res) => {


        let data = {
            proprietaire: req.body.proprietaire
        }

        let sql= 'INSERT INTO sheet(nomDocument, dateDeModification, dateDeCreation, proprietaire, contenu) VALUES ("Sheet !", datetime(), datetime(), ?, ?)' ;
        let contenu ="" ;
        for (let i = 0; i < 26; i++) {
            for (let j = 0; j < 25 ; j++) {
                contenu+=";"
            }
            contenu+="\n"
        }
        db.run(sql, data.proprietaire,contenu, function (err, result) {
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


        if(tableau === null){
            let sql = "select contenu from sheet where idSheet = ?";
            db.get(sql, [req.params.id], function (err, result) {
                if (err) {
                    //res.status(400).json({"error": err.message})
                    console.log(err)
                }else {
                    let content = [];
                    const lines = result.contenu.split('\n');

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line) {
                            const values = line.split(';');
                            content.push(values);
                        }
                    }

                    tableau = content;
                }
            })
        }


        let params = [req.params.id];
        let sql = "select idSheet, nomDocument, dateDeModification, dateDeCreation, proprietaire from sheet where idSheet = ?";

        db.get(sql,params,(err, row)=>{
            if (err) {
                res.status(400).json({"error":err.message});
                console.log(err)
                return;
            }
            if (row===undefined) {
                res.status(404).json({"error" : "No sheet"});
                return;
            }

            row.contenu = convertToCSV(tableau);

            console.log(row.contenu);
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

        let sql = 'Select distinct id,first_name, last_name, email from participation natural join user where not idSheet = ? and id=participant;'

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


    /*

            CONNECTION SOCKET

     */




    io.on('connection',(socket)=> {

        let userId = -1;
        socket.on('disconnect',()=>{

            users.delete(userId);

            io.emit('user_disconnected', mapToArray(users));
            console.log("User " + userId + ' disconnected');
        })
        socket.on('identification',(user,id_sheet) => {
            users.set(user.id, {username : generateName(), x : -1, y : -1, color : colors[Math.floor(Math.random() * colors.length)]})
            userId = user.id;

            io.emit('user_connected', mapToArray(users));
            console.log("User " + user.id + " connected");
        })
        socket.on('select_cell', (id, x, y) => {

            users.set(id, {username : users.get(id)?.username, x, y, color : users.get(id)?.color})
            io.emit('selected_cell', mapToArray(users))
            console.log("User " + id + " moved focus to cell (" + x + ", " + y + ")")
        })
        socket.on('modifie_cell', (id, x, y, val) => {

        })
    });

    function mapToArray (map) {
        return Array.from(map, ([id, infos]) => ({id, infos}));
    }

    const animals = [
        "Lamantin",
        "Okapi",
        "Panda",
        "Blaireau",
        "Narval",
        "Ecureuil",
        "Oiseau",
        "Aigle",
        "Papillon",
        "Tatou",
        "Singe",
        "Ver",
        "Termite",
        "Chenille",
        "Hérisson",
        "Poulet",
        "Sanglier",
        "Génie",
        "Porc",
        "Croco",
        "Coq",
        "Raptor",
        "Lapin",
        "Faucheux",
        "Escargot",
        "Bagnat",
        "Logique",
        "Limace",
        "Mollusque",
        "Titan",
        "Gendarme",
        "Alligator",
        "Colombe",
        "Pigeon",
        "Cafard",
        "Scarabée",
        "Iguane",
        "Raie",
        "Tortue",
        "Fourmi",
        "Serpent",
        "Zèbre",
        "Chèvre",
        "Cheval",
        "Chat",
        "Chatte",
        "Hyène",
        "Antilope",
        "Poisson",
        "Manchot",
        "Truite",
        "Souris",
        "Méduse",
        "Paresseux",
        "Guépard",
        "Chiot",
        "Lion",
        "Vautour",
        "Dauphin",
        "Pingouin",
        "Otarie",
        "Fantôme",
        "Martien",
        "Patate",
        "Rat",
        "Girafe",
        "Kawa",
        "Renne",
        "Loutre",
        "Taupe",
        "Autruche",
        "Concombre de Mer",
        "Brebis",
        "Kiwi",
    ]
    const adjectives = [
        "Cringe",
        "Gênant",
        "Désastreux",
        "Malsain",
        "Svelte",
        "Titanesque",
        "Chokbar",
        "Surprise",
        "Voyant",
        "Pédant",
        "Tatoué",
        "Sans tête",
        "Déter'",
        "Atomique",
        "Unifiable",
        "Résolu",
        "Tarpin Tendu",
        "Choqué",
        "Gêné",
        "Épique",
        "Explosif",
        "Cocaïnoman",
        "Dissident",
        "Nymphomane",
        "Fauché",
        "À Réaction",
        "Supralumunique",
        "Du 1er Ordre",
        "Supersonique",
        "Courbé",
        "Vertébré",
        "Miniature",
        "Braisé",
        "Corporatiste",
        "Nomade",
        "Millénaire",
        "Sataniste",
        "Intelligent",
        "Critique",
        "Creux",
        "Superposable",
        "Imposante",
        "Menteur",
        "Humide",
        "Stellaire",
        "Sympa",
        "Fatigué",
        "Rayé",
        "Menaçant",
        "HPI",
        "Chafouin",
        "Énorme",
        "Défoncé",
        "Déshydraté",
        "Glissant",
        "Ghetto",
        "Suspecte",
        "Électrique",
        "Flexible",
        "Pluvieux",
        "Hyperactif",
        "Mou",
        "Diabolique",
        "Pacifiste",
        "Végan",
        "Constipé",
        "Hydrophobe",
        "Éphémère",
        "Anticonstitutionnel",
        "Suprême",
        "Superstitieux",
        "Aliéné",
        "De Forain",
        "Albinos",
        "Dépensier",
        "Étrange",
        "D'Assaut",
        "De Siège",
        "De Combat",
        "Petit",
        "Alcoolique",
        "Noyé",
        "Céleste",
        "Visionnaire",
        "Tunnelier",
        "Ajusté",
        "Siamois",
        "Galeux",
        "Doué",
        "Crochu",
        "Anarchiste",
        "Bleu",
        "Haineux",
        "Crédible",
        "Fumé",
        "Salé",
        "Incapable",
        "Moldave",
    ]

    function generateName () {
        return animals[Math.floor(Math.random() * animals.length)] + " " + adjectives[Math.floor(Math.random() * adjectives.length)];
    }
    function convertToCSV(matrix) {
        if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0]) || matrix[0].length === 0) {
            console.error('Invalid input. Please provide a non-empty 2D array.');
            return '';
        }

        // Escaping function for CSV
        function escapeCSVValue(value) {
            if (typeof value === 'string') {
                // Escape double quotes by replacing them with two double quotes
                return  value.replace(/"/g, '""') ;
            } else {
                return value;
            }
        }

        // Convert the matrix to CSV format
        const csvRows = matrix.map(row => row.map(escapeCSVValue).join(';'));

        // Join the rows with newline characters
        const csvString = csvRows.join('\n');

        return csvString;
    }

    return router;
}
