const express = require('express');
const { createServer } = require('node:http');

// app est la fonction de rappel créée par Express
const app = express();

const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');

// get config vars
dotenv.config();

const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');


const db = require('./database');
const bodyParser = require("body-parser");
const cors = require('cors')
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    credentials: true,
}))

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

app.get("/api/users", (req, res, next) => {
    var sql = "select * from user"
    var params = []
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

const server = createServer(app);
const port = 3000;

// lancement du serveur avec log du moment où il est prêt
server.listen(port, () => console.log(`Serveur lancé sur http://localhost:${port}`));