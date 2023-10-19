const express = require('express');
const { createServer } = require('node:http');

// app est la fonction de rappel créée par Express
const app = express();

app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

const server = createServer(app);
const port = 3000;

// lancement du serveur avec log du moment où il est prêt
server.listen(port, () => console.log(`Server launched on port ${port}`));