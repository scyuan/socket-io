var express = require('express');
var router = express.Router();

var app = require('express')();
var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);
//开启端口监听socket
server.listen(3001);
var socket = io.listen(server,{origins: '*:*'});

var users = [];
var roles = ['blue','red'];
var connections = [];

socket.on('connection', function(socket){
    console.log(socket.id,'用户已经连接上');
    connections.push(socket.id);

    if(users.length >= 2 ){
        // 如果已经连上了两位则发送暂时无法加入游戏
        // 提示当前用户无法加入游戏
        io.sockets.sockets[socket.id].emit('info',{info:'人数已满，暂时无法加入游戏'+users.length});
        return ;
    }else{
        users.push(socket.id);
        if(users.length == 2){
            // 分配红蓝方
            for(let i = 0 ; i < users.length ; i ++){
                io.sockets.sockets[users[i]].emit('socketId',{id:users[i],role:roles[i],canChess:i == 0?true:false});
            }
        }
    }
    // socket.emit('server_info', { hello: 'world' });

    // 监听棋子落子
    socket.on('chess',function (data) {
        console.log(data);
        var send = data.id == users[0]?users[1]:users[0];
        io.sockets.sockets[send].emit('fresh',{chess:data.chess,next:data.role == 'blue'?'red':'blue'});
    })

    // 客户端断开连接
    socket.on("disconnect", function() {

        var index = users.indexOf(this.id);
        if(index < 0){
            console.log("a user go out");
        }else{
            users.splice(index,1);
            if(users.length!=0){
                console.log(users[0]);
                io.sockets.sockets[users[0]].emit('someone_disconnect',{info:'对手断开连接，请重新等待'});
            }
            console.log('a player go out');
        }
    });

    // 监听移除的棋子
    socket.on('eat',function (data) {
        console.log(data);
        var send = data.id == users[0]?users[1]:users[0];
        io.sockets.sockets[send].emit('remove',{chess:data.chess});
    })

});



module.exports = router;