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


let users = new Map();
const colors = ['green', 'red', 'pink', 'yellow', 'purple', 'blue']

io.on('connection',(socket)=> {
        let userId = -1;
        socket.on('disconnect',()=>{

            users.delete(userId);

            io.emit('user_disconnected', mapToArray(users));
            console.log("User " + userId + ' disconnected');
        })
        socket.on('identification',(user) => {
            users.set(user.id, {username : user.first_name + " " + user.last_name, x : -1, y : -1, color : colors[Math.floor(Math.random() * colors.length)]})
            userId = user.id;

            io.emit('user_connected', mapToArray(users));
            console.log("User " + user.id + " connected");
        })
        socket.on('select_cell', (id, x, y) => {

            users.set(id, {username : users.get(id)?.username, x, y, color : users.get(id)?.color})
            io.emit('selected_cell', mapToArray(users))
            console.log("User " + id + " moved focus to cell (" + x + ", " + y + ")")
        })
    });

function mapToArray (map) {
    return Array.from(map, ([id, infos]) => ({id, infos}));
}


// lancement du serveur avec log du moment où il est prêt
server.listen(port, () => console.log(`Serveur lancé sur http://localhost:${port}`));