module.exports = function (io) {

    const express = require('express'), router = express.Router();
    const db = require("../database");


    let sheets = new Map();
    const colors = ['green', 'red', 'pink', 'yellow', 'purple', 'blue']

    // Route de création de feuille
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
            contenu+="\n";
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

    // Route de récupération de contenu de feuille
    router.get('/:id', (
        req,
        res) => {
        if (sheets.get(req.params.id) == null) {
        //if(tableau === null){
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
                    sheets.set(req.params.id, {tableau : content , utilisateurs : new Map()})
                    let sheetsObj = {};
                    sheets.forEach((value, key) => {
                        sheetsObj[key] = value;
                    });

                    //tableau = content;
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
            //row.contenu = convertToCSV(tableau);
            row.contenu = convertToCSV(sheets.get(req.params.id).tableau);

            res.json({
                "message":"success",
                "data":row
            })

        });

    });

    // Route de récupération de la liste des membres d'une feuille
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

    // Route de récupération de la liste des utilisateurs qui ne sont pas membres d'une feuille
    router.get('/:id/notmembers',(req,res) => {

        let sql = 'SELECT id,first_name,last_name,email\n' +
            'FROM user u\n' +
            'WHERE NOT EXISTS (\n' +
            '    SELECT id\n' +
            '    FROM participation p\n' +
            '    WHERE p.participant = u.id\n' +
            '      AND p.idSheet = ?\n' +
            ')\n' +
            'AND NOT EXISTS (\n' +
            '    SELECT id\n' +
            '    FROM sheet s\n' +
            '    WHERE s.proprietaire = u.id\n' +
            '      AND s.idSheet = ?\n' +
            ');'

        db.all(sql,[req.params.id,req.params.id],function (err,row){
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

    // Route d'ajout d'utilisateur à une feuille
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

    // Route de suppression d'utilisateur dans une feuille
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

    // Route de vérification d'appartenance d'un utilisateur
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

    // Route de suppression de feuille
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

    // Route de renommage de route
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
        let id_sheet_save = -1;
        let userId = -1;
        socket.on('disconnect',()=>{
            if(id_sheet_save !== -1){
            sheets.get(id_sheet_save).utilisateurs.delete(userId);
            io.emit('user_disconnected', mapToArray(get_users_tmp(sheets.get(id_sheet_save).utilisateurs)));
            console.log("User " + userId + ' disconnected');
            }
        })
        socket.on('identification',(user,id_sheet) => {
            id_sheet_save = id_sheet;
            sheets.get(id_sheet).utilisateurs.set(user.id, {username : generateName(), x : -1, y : -1, color : colors[Math.floor(Math.random() * colors.length)],socket_user : socket})
            userId = user.id;

            let localUserMap = sheets.get(id_sheet).utilisateurs;
            for (const [key, value] of localUserMap) {
                value.socket_user.emit('user_connected', mapToArray(get_users_tmp(localUserMap)));
            }
            //io.emit('user_connected', mapToArray(get_users_tmp(sheets.get(id_sheet).utilisateurs)));
            console.log("User " + user.id + " connected to sheet " + id_sheet);
        })
        socket.on('select_cell', (id, x, y,id_sheet) => {
            if(id_sheet_save !== -1){
                let users = sheets.get(id_sheet).utilisateurs;
                let socket_tmp = users.get(id).socket_user;
                users.set(id, {username : users.get(id)?.username, x, y, color : users.get(id)?.color, socket_user : socket_tmp})
                const utilisateursMap = sheets.get(id_sheet).utilisateurs;
                for (const [userId, userData] of utilisateursMap) {
                    userData.socket_user.emit('selected_cell', mapToArray(get_users_tmp(sheets.get(id_sheet).utilisateurs)));
                }
                console.log("User " + id + " moved focus to cell (" + x + ", " + y + ")" +" in sheet :"+id_sheet)
            }
        })
        socket.on('modify_cell', (x, y, val,id_sheet) => {
            if(id_sheet_save !== -1) {
                sheets.get(id_sheet).tableau[x][y] = val;
                const utilisateursMap = sheets.get(id_sheet).utilisateurs;
                for (const [userId, userData] of utilisateursMap) {
                    userData.socket_user.emit('modified_cell', x, y, val);
                }
            }
        })
        socket.on('save',(id) =>{
            if(id_sheet_save !== -1) {
                let saveSheet = convertToCSV(sheets.get(id).tableau);
                let sql = 'Update sheet Set contenu = ?, dateDeModification = datetime() where idSheet = ?;'
                db.run(sql,[saveSheet,id],function (err,row){
                    if (err){
                        console.log("Can't save the sheet in the database");
                    }
                });
            }
        })

    });

    // Transforme une map en array (pour envoi via socket)
    function mapToArray (map) {
        return Array.from(map, ([id, infos]) => ({id, infos}));
    }

    // Reformate la liste des utilisateurs pour la faire afficher correctement
    function get_users_tmp(map_user){
        let users_tmp = new Map();
        for (let [user_id,data] of map_user) {
            users_tmp.set(user_id, {username : data.username,x : data.x, y : data.y, color: data.color })
        }
        return users_tmp;
    }


    const animals = [
        {nom : "Lamantin", feminin : false},
        {nom : "Okapi", feminin : false},
        {nom : "Panda", feminin : false},
        {nom : "Blaireau", feminin : false},
        {nom : "Narval", feminin : false},
        {nom : "Ecureuil", feminin : false},
        {nom : "Oiseau", feminin : false},
        {nom : "Aigle", feminin : false},
        {nom : "Papillon", feminin : false},
        {nom : "Tatou", feminin : false},
        {nom : "Singe", feminin : false},
        {nom : "Ver", feminin : false},
        {nom : "Termite", feminin : true},
        {nom : "Chenille", feminin : true},
        {nom : "Hérisson", feminin : false},
        {nom : "Poulet", feminin : false},
        {nom : "Sanglier", feminin : false},
        {nom : "Génie", feminin : false},
        {nom : "Porc", feminin : false},
        {nom : "Croco", feminin : false},
        {nom : "Coq", feminin : false},
        {nom : "Raptor", feminin : false},
        {nom : "Lapin", feminin : false},
        {nom : "Faucheux", feminin : false},
        {nom : "Escargot", feminin : false},
        {nom : "Bagnat", feminin : false},
        {nom : "Logique", feminin : true},
        {nom : "Limace", feminin : true},
        {nom : "Mollusque", feminin : false},
        {nom : "Titan", feminin : false},
        {nom : "Gendarme", feminin : false},
        {nom : "Alligator", feminin : false},
        {nom : "Colombe", feminin : true},
        {nom : "Pigeon", feminin : false},
        {nom : "Cafard", feminin : false},
        {nom : "Scarabée", feminin : false},
        {nom : "Iguane", feminin : false},
        {nom : "Raie", feminin : true},
        {nom : "Tortue", feminin : true},
        {nom : "Fourmi", feminin : true},
        {nom : "Serpent", feminin : false},
        {nom : "Zèbre", feminin : false},
        {nom : "Chèvre", feminin : true},
        {nom : "Cheval", feminin : false},
        {nom : "Chat", feminin : false},
        {nom : "Chatte", feminin : true},
        {nom : "Hyène", feminin : true},
        {nom : "Antilope", feminin : true},
        {nom : "Poisson", feminin : false},
        {nom : "Manchot", feminin : false},
        {nom : "Truite", feminin : true},
        {nom : "Souris", feminin : true},
        {nom : "Méduse", feminin : true},
        {nom : "Paresseux", feminin : false},
        {nom : "Guépard", feminin : false},
        {nom : "Chiot", feminin : false},
        {nom : "Lion", feminin : false},
        {nom : "Vautour", feminin : false},
        {nom : "Dauphin", feminin : false},
        {nom : "Pingouin", feminin : false},
        {nom : "Otarie", feminin : true},
        {nom : "Fantôme", feminin : false},
        {nom : "Martien", feminin : false},
        {nom : "Patate", feminin : true},
        {nom : "Rat", feminin : false},
        {nom : "Girafe", feminin : true},
        {nom : "Kawa", feminin : false},
        {nom : "Renne", feminin : false},
        {nom : "Loutre", feminin : true},
        {nom : "Taupe", feminin : true},
        {nom : "Autruche", feminin : true},
        {nom : "Concombre de Mer", feminin : false},
        {nom : "Brebis", feminin : true},
        {nom : "Kiwi", feminin : false},
        {nom : "Dinde", feminin : true},
        {nom : "Kraken", feminin : false},
        {nom : "Fable", feminin : true},
        {nom : "Forêt", feminin : true},
    ]
    const adjectives = [
        {feminin : "Cringe", masculin : "Cringe"},
        {feminin : "Gênante", masculin : "Gênant"},
        {feminin : "Désastreuse", masculin : "Désastreux"},
        {feminin : "Malsaine", masculin : "Malsain"},
        {feminin : "Svelte", masculin : "Svelte"},
        {feminin : "Titanesque", masculin : "Titanesque"},
        {feminin : "Chokbar", masculin : "Chokbar"},
        {feminin : "Surprise", masculin : "Surprise"},
        {feminin : "Voyante", masculin : "Voyant"},
        {feminin : "Pédante", masculin : "Pédant"},
        {feminin : "Tatouée", masculin : "Tatoué"},
        {feminin : "Sans tête", masculin : "Sans tête"},
        {feminin : "Déter'", masculin : "Déter'"},
        {feminin : "Atomique", masculin : "Atomique"},
        {feminin : "Unifiable", masculin : "Unifiable"},
        {feminin : "Résolue", masculin : "Résolu"},
        {feminin : "Tarpin Tendu", masculin : "Tarpin Tendu"},
        {feminin : "Choquée", masculin : "Choqué"},
        {feminin : "Gênée", masculin : "Gêné"},
        {feminin : "Épique", masculin : "Épique"},
        {feminin : "Explosive", masculin : "Explosif"},
        {feminin : "Cocaïnomane", masculin : "Cocaïnoman"},
        {feminin : "Dissidente", masculin : "Dissident"},
        {feminin : "Nymphomane", masculin : "Nymphomane"},
        {feminin : "Fauchée", masculin : "Fauché"},
        {feminin : "À Réaction", masculin : "À Réaction"},
        {feminin : "Supralumunique", masculin : "Supraluminique"},
        {feminin : "Du 1er Ordre", masculin : "Du 1er Ordre"},
        {feminin : "Supersonique", masculin : "Supersonique"},
        {feminin : "Courbée", masculin : "Courbée"},
        {feminin : "Vertébrée", masculin : "Vertébré"},
        {feminin : "Miniature", masculin : "Miniature"},
        {feminin : "Braisée", masculin : "Braisé"},
        {feminin : "Corporatiste", masculin : "Corporatiste"},
        {feminin : "Nomade", masculin : "Nomade"},
        {feminin : "Millénaire", masculin : "Millénaire"},
        {feminin : "Sataniste", masculin : "Sataniste"},
        {feminin : "Intelligente", masculin : "Intelligent"},
        {feminin : "Critique", masculin : "Critique"},
        {feminin : "Creuse", masculin : "Creux"},
        {feminin : "Superposable", masculin : "Superposable"},
        {feminin : "Imposante", masculin : "Imposant"},
        {feminin : "Menteuse", masculin : "Menteur"},
        {feminin : "Humide", masculin : "Humide"},
        {feminin : "Stellaire", masculin : "Stellaire"},
        {feminin : "Sympa", masculin : "Sympa"},
        {feminin : "Fatiguée", masculin : "Fatigué"},
        {feminin : "Rayée", masculin : "Rayé"},
        {feminin : "Menaçante", masculin : "Menaçant"},
        {feminin : "HPI", masculin : "HPI"},
        {feminin : "Chafouin", masculin : "Chafouin"},
        {feminin : "Énorme", masculin : "Énorme"},
        {feminin : "Défoncée", masculin : "Défoncé"},
        {feminin : "Déshydratée", masculin : "Déshydraté"},
        {feminin : "Glissante", masculin : "Glissant"},
        {feminin : "Ghetto", masculin : "Ghetto"},
        {feminin : "Suspecte", masculin : "Suspect"},
        {feminin : "Électrique", masculin : "Électrique"},
        {feminin : "Flexible", masculin : "Flexible"},
        {feminin : "Pluvieuse", masculin : "Pluvieux"},
        {feminin : "Hyperactive", masculin : "Hyperactif"},
        {feminin : "Molle", masculin : "Mou"},
        {feminin : "Diabolique", masculin : "Diabolique"},
        {feminin : "Pacifiste", masculin : "Pacifiste"},
        {feminin : "Végane", masculin : "Végan"},
        {feminin : "Constipée", masculin : "Constipé"},
        {feminin : "Hydrophobe", masculin : "Hydrophobe"},
        {feminin : "Éphémère", masculin : "Éphémère"},
        {feminin : "Anticonstitutionnelle", masculin : "Anticonstitutionnel"},
        {feminin : "Suprême", masculin : "Suprême"},
        {feminin : "Superstitieux", masculin : "Superstitieuse"},
        {feminin : "Aliénée", masculin : "Aliéné"},
        {feminin : "De Forain", masculin : "De Forain"},
        {feminin : "Albinos", masculin : "Albinos"},
        {feminin : "Dépensière", masculin : "Dépensier"},
        {feminin : "Étrange", masculin : "Étrange"},
        {feminin : "D'Assaut", masculin : "D'Assaut"},
        {feminin : "De Siège", masculin : "De Siège"},
        {feminin : "De Combat", masculin : "De Combat"},
        {feminin : "Petite", masculin : "Petit"},
        {feminin : "Alcoolique", masculin : "Alcoolique"},
        {feminin : "Noyée", masculin : "Noyé"},
        {feminin : "Céleste", masculin : "Céleste"},
        {feminin : "Visionnaire", masculin : "Visionnaire"},
        {feminin : "Tunnelière", masculin : "Tunnelier"},
        {feminin : "Ajustée", masculin : "Ajusté"},
        {feminin : "Siamoise", masculin : "Siamois"},
        {feminin : "Galeuse", masculin : "Galeux"},
        {feminin : "Douée", masculin : "Doué"},
        {feminin : "Crochue", masculin : "Crochu"},
        {feminin : "Anarchiste", masculin : "Anarchiste"},
        {feminin : "Bleue", masculin : "Bleu"},
        {feminin : "Haineuse", masculin : "Haineux"},
        {feminin : "Crédible", masculin : "Crédible"},
        {feminin : "Fumée", masculin : "Fumé"},
        {feminin : "Salée", masculin : "Salé"},
        {feminin : "Incapable", masculin : "Incapable"},
        {feminin : "Moldave", masculin : "Moldave"},
        {feminin : "Sulfureuse", masculin : "Sulfureux"},
        {feminin : "Rapide", masculin : "Rapide"},
        {feminin : "Imparable", masculin : "Imparable"},
        {feminin : "Aigrie", masculin : "Aigri"},
        {feminin : "Méchante", masculin : "Méchant"},
        {feminin : "Faite Maison", masculin : "Fait Maison"},
        {feminin : "Fabuleuse", masculin : "Fabuleux"},
    ]

    // Génère un nom aléatoire avec les deux listes ci-dessus
    function generateName () {
        let animal = animals[Math.floor(Math.random() * animals.length)];
        let adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        return animal.nom + " " + (animal.feminin ? adjective.feminin : adjective.masculin);
    }

    // Convertit un tableau 2D en CSV pour la sauvegarde dans la base de données
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
