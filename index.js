//getting library to use 
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const path = require('path');
const { Server } = require("socket.io");
const io = new Server(server);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
});

app.use('/icons', express.static(__dirname + '/icons' )),

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });
    socket.on('chat message', (msg) => {
        socket.emit('chat message', {text: msg, from: 'your'});

        socket.broadcast.emit('chat message', {text: msg, from: 'other'})
        
    });
    
});


server.listen(3000, '0.0.0.0', () => {
    console.log('listening on *:3000')
});