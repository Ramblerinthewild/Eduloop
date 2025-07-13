//getting library to use 
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const path = require('path');
const { Server } = require("socket.io");
const io = new Server(server);

//modules for handling sending files and paths 
const multer = require('multer');

const upload = multer({
    storage: multer.diskStorage({
        destination: "attachments",  // Make sure this folder exists
        filename: (req, file, cb) => {  // Fixed parameters
            cb(null, Date.now() + path.extname(file.originalname))
        }
    }),
    limits: {fileSize: 20000000},
    fileFilter: (req, file, cb) => {
        const validFileTypes = /jpg|jpeg|png|gif|pdf|txt|doc|docx/; // Add more types if needed
        const extname = validFileTypes.test(path.extname(file.originalname).toLowerCase());
        
        if(extname){
            return cb(null, true);
        } else {
            return cb("Error: Invalid file type!");
        }
    }
}).single("file"); 


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
});

app.post('/attachments', (req, res) => {
    upload(req, res, (err) => {
        if(err){
            res.send(err)
            // This will display the error message to the user
        }
        else{
            res.json({
                message: "File Uploaded Successfully",
                filename: req.file.originalname,
                
                url: `/${req.file.filename}`
            });
            }
    })

});

app.use('/icons', express.static(__dirname + '/icons' ));
app.use(express.static('attachments'));


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });

    
    socket.on('set username', (username) => {
        socket.username = username;
        console.log(`User set username: ${username}`);
    });

    socket.on('join room', (room) => {
        for (const r of socket.rooms) {
            if (r !== socket.id) {
                socket.leave(r);
                console.log(`user left ${room}`)
            };
        };
        socket.join(room); 
        console.log(`user joined: ${room}`);
    });

    socket.on('chat message', (data) => {

        if (data.isFile) {
            socket.to(data.room).emit('chat message', {
                isFile: true,
                fileName: data.fileName,
                fileUrl: data.fileUrl,
                from: 'other',
                username: socket.username
            });

            socket.emit('chat message', {
                isFile: true,
                fileName: data.fileName,
                fileUrl: data.fileUrl,
                from: 'your',
                username: socket.username
            });
        } else {
            socket.to(data.room).emit('chat message', {text: data.msg, from: 'other', username: socket.username});

            socket.emit('chat message', {text: data.msg, from: 'your', username: socket.username})
        }
    });
    
});


server.listen(3000, '0.0.0.0', () => {
    console.log('listening on *:3000')
});