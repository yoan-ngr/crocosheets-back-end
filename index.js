const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

// app est la fonction de rappel créée par Express
const app = express();

const dotenv = require('dotenv');
const server = createServer(app);
const port = 3000;


// get config vars
dotenv.config();

const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const sheetRoutes = require('./routes/sheet');


const db = require('./database');
const bodyParser = require("body-parser");
const cors = require('cors')
const io = new Server(server,{cors : {
        origin : "http://localhost:5173"
    }});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    credentials: true,
}))

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sheet', sheetRoutes(io));


app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

// Route pour récupérer la liste des utilisateurs
app.get("/api/users", (req, res, next) => {
    let sql = "select * from user"
    let params = []
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

// Route pour récupérer les feuilles d'un utilisateur
app.get('/api/sheets/:userid', (
    req,
    res) => {

    let sql = 'SELECT DISTINCT s.idSheet, s.nomDocument, s.dateDeModification, s.proprietaire\n' +
        'FROM sheet s\n' +
        'LEFT JOIN participation p ON s.idSheet = p.idSheet\n' +
        'WHERE p.participant = ?\n' +
        '   OR s.proprietaire = ?; ;'
    let params = [req.params.userid, req.params.userid]
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





// lancement du serveur avec log du moment où il est prêt
server.listen(port, () => console.log(`Serveur lancé sur http://localhost:${port}`));