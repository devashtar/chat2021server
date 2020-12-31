const route = require('express').Router();
const bodyParser = require('body-parser').json();
const session = require('express-session');

// ALL Requests and events socket will be here! <<<<<<<<<<< !!!!!!!!!!!!!   (' _ <)

let storeUsers = [];        // {username: 'nickname', password: '123'}
let allUsers = [];  // {name: 'username', socketId: socket.id}
let allRooms = [{room: 'MainRoom', users: [], storeMessage: []}];   // << Here you must add users for update info room about - state users

const updateRoomUsers = async (id) => {
    const { name } = await allUsers.find((item) => item.socketId === id);
    const npmIdx = await allRooms.findIndex(i => {
        for (let user of i.users) {
            if (user === name) return true;
        }
    })
    allRooms[npmIdx].users = await allRooms[npmIdx].users.filter(item => item !== name);
    allUsers = await allUsers.filter((item) => item.socketId !== id);
    io.emit(`${allRooms[npmIdx].room} users info`, allRooms[npmIdx].users);
    io.emit('total info', JSON.stringify({users: allUsers.length, rooms: allRooms.length}));
    return true;
}

io.on('connection', function(socket) {
    allUsers.push({name: '', socketId: socket.id})
    socket.on('disconnect', async () => {
        await updateRoomUsers(socket.id);
        allUsers = await allUsers.filter((item) => item.socketId !== socket.id);
    });
});
////////////////////////////         ROUTES        /////////////////////////////////////

route.post('/reg', bodyParser, async (req, res) => {
    for await (let item of storeUsers) {
        if (item.username === req.body.login) {
            res.status(401).end();
            return;
        }
    }
    storeUsers.push({username: req.body.login, password: req.body.password})
    res.status(201).json({clarification: 'reg', name: req.body.login});
})

route.post('/login', bodyParser, async (req, res) => {
    const registeredUser = storeUsers.find(item => req.body.password === item.password && req.body.login === item.username)
    if (!registeredUser) {
        res.status(400).end();
    } else {
        req.session.name = req.body.login;
        res.status(200).json({clarification: 'login', name: req.body.login, room: 'MainRoom'});
    }
})

route.post('/confirm', bodyParser, async (req, res) => {
    const tmpIndex = await allUsers.findIndex((i) => i.socketId === req.body.socketId);
    allUsers[tmpIndex].name = await req.body.username;

    const tmpIndexCRU = await allRooms.findIndex((item) => item.room === req.body.room);
    await allRooms[tmpIndexCRU].users.push(req.body.username);
    const roomsNamesArray = allRooms.map((item) => item.room);

    io.emit(`rooms info`, roomsNamesArray);
    io.emit(`${req.body.room} users info`, allRooms[tmpIndexCRU].users);
    io.emit('total info', JSON.stringify({users: allUsers.length, rooms: allRooms.length}));
    res.status(200).json({storeMessage: allRooms[0].storeMessage});
})

route.post('/changeroom', bodyParser, async (req, res) => {
    const npmIdx = await allRooms.findIndex(i => {
        for (let user of i.users) {
            if (user === req.body.username) return true;
        }
    })

    allRooms[npmIdx].users = await allRooms[npmIdx].users.filter(item => item !== req.body.username);
    io.emit(`${allRooms[npmIdx].room} users info`, allRooms[npmIdx].users);  // updating information about users of the room you left

    const tmpIndexCRU = await allRooms.findIndex((item) => item.room === req.body.room);
    await allRooms[tmpIndexCRU].users.push(req.body.username);
    const roomsNamesArray = await allRooms.map((item) => item.room);

    io.emit('rooms info', roomsNamesArray);
    io.emit(`${req.body.room} users info`, allRooms[tmpIndexCRU].users);    //updating information about users of the room that came
    io.emit('total info', JSON.stringify({users: allUsers.length, rooms: allRooms.length}));
    res.status(200).json({storeMessage: allRooms[tmpIndexCRU].storeMessage})
})

route.get('/logout', async (req, res) => {
    req.session.destroy(err => { if (err) throw err });
    res.status(200).end();
})

route.get('/chat', async (req, res) => {
    if (req.session.name) {
        res.status(200).json({name: req.session.name, room: 'MainRoom'});
    } else {
        res.status(400).end();
    }
})

const limitMessagesStore = async (i, objMes) => {
    const limit = -20;
    await allRooms[i].storeMessage.push(objMes);
    if (allRooms[i].storeMessage.length <= limit) {
        return true;
    } else {
        allRooms[i].storeMessage = await allRooms[i].storeMessage.slice(limit);
        return true;
    }
}

route.post('/message', bodyParser, async (req, res) => {
    if (req.session.name) {
        const objMes = {name: req.body.name, textMessage: req.body.text, date: new Date().toLocaleString()}
        const tmpIdx = await allRooms.findIndex(item => req.body.room === item.room);
        await limitMessagesStore(tmpIdx, objMes);
        io.emit(req.body.room, objMes);
        res.status(200).end();
    } else {
        res.status(400).end();
    }
})

route.post('/addroom', bodyParser, async (req, res) => {
    if (req.session.name) {
        await allRooms.push({room: req.body.data, users: [], storeMessage: []})
        const roomsNamesArray = await allRooms.map((item) => item.room);
        io.emit('rooms info', roomsNamesArray);
        res.status(200).end();
    } else {
        res.status(400).end();
    }
})

route.post('/privmes', bodyParser, (req, res) => {
    if (req.session.name) {
        io.emit(req.body.recipient, JSON.stringify({sender: req.body.sender, text: req.body.text, date: new Date().toLocaleString()}));
        res.status(200).end();
    } else {
        res.status(400).end();
    }
})
////////////////////////////         /ROUTES        /////////////////////////////////////

module.exports = route;

