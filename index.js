const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

// app est la fonction de rappel créée par Express
const app = express();

const jwt = require('jsonwebtoken');

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
const bcrypt = require("bcrypt");

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

app.get('/api/sheets/:userid', (
    req,
    res) => {

    let sql = "select * from sheet where proprietaire = ?"
    let params = [req.params.userid]
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


let users = [];


io.on('connection',(socket)=> {
        console.log('connected');
        let username = "";
        socket.on('disconnect',()=>{
            console.log(username + ' disconnected');
            users.splice(users.indexOf(username), 1);
            io.emit('user_disconnected', users);
        })
        socket.on('identification',(id) => {
            if(!users.includes(id))
                users.push(id);

            username = id;
            io.emit('user_connected',users);
            console.log("utilisateur connecté :"+id);
        })
    });





// lancement du serveur avec log du moment où il est prêt
server.listen(port, () => console.log(`Serveur lancé sur http://localhost:${port}`));