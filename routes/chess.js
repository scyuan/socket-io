var express = require('express');
var router = express.Router();

var app = require('express')();
var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);
//开启端口监听socket
server.listen(3001);
var socket = io.listen(server,{origins: '*:*'});

var user1 = '';
var user2 = '';
var roles = ['blue','red'];

socket.on('connection', function(socket){
    console.log(socket.id);
    if(user1 == ''){
        user1 = socket.id;
        // console.log({id:user1,role:roles.pop()})
        io.sockets.sockets[user1].emit('socketId',{id:user1,role:roles.pop(),canChess:true});
    }else{
        user2 = socket.id;
        // console.log({id:user1,role:roles.pop()})
        io.sockets.sockets[user2].emit('socketId',{id:user2,role:roles.pop(),canChess:false});
    }



    // socket.emit('server_info', { hello: 'world' });

    // 监听棋子落子
    socket.on('chess',function (data) {
        console.log(data);
        if(data.id == user1){
            io.sockets.sockets[user2].emit('fresh',{chess:data.chess,next:data.role == 'blue'?'red':'blue'});
        }else{
            io.sockets.sockets[user1].emit('fresh',{chess:data.chess,next:data.role == 'blue'?'red':'blue'});
        }

    })
    socket.on('client', function (data) {
        console.log(data);
    });
    socket.on("disconnect", function() {
        console.log("a user go out");
    });


});



module.exports = router;