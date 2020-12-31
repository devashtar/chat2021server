const express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
const path = require('path');

const PORT = process.PORT || 4000;

app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Headers', 'Access-Control-Allow-Credentials, access-control-allow-origin, Content-Type')
    .set('access-control-allow-origin', 'http://localhost:3000')
    .set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    .set('Access-Control-Allow-Credentials', 'true')
    .status(200).end();
})
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Credentials', 'true').set('access-control-allow-origin', 'http://localhost:3000');
    next(); 
})

//  ********   Socket.io   ********   //
const io = require('socket.io')(http, {
    cors: 'access-control-allow-origin'
});
global.io = io;
//  ********   /Socket.io   ********   //

//     **********   session-express   **********     //
const session = require('express-session');             
const optionSession = require('./session-option.js');
app.use(session(optionSession));
//     **********   /session-express   **********     //

//       ***** Action *****       //
                                                // reg, login, logout, check session, and sockets events
const actions = require('./action/Action.js');  // send message, connect, disconnect, join ...
app.use(actions);
//       ***** /Action *****       //

app.use(express.static(path.join(__dirname, 'public'), {extensions: ['html']}));  // express.static()

http.listen(PORT);