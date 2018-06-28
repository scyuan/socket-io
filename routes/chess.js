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
var rooms = [];



socket.on('connection', function(socket){
    // console.log(socket.id,'用户已经连接上');
    // console.log(socket);
    connections.push({username:'',id:socket.id});
    // io.sockets.sockets[socket.id].emit('connection_feedback',{info:'你已连接到象棋对战',rooms:rooms});
    // if(users.length >= 2 ){
    //     // 如果已经连上了两位则发送暂时无法加入游戏
    //     // 提示当前用户无法加入游戏
    //     io.sockets.sockets[socket.id].emit('info',{info:'人数已满，暂时无法加入游戏'+users.length});
    //     return ;
    // }else{
    //     users.push(socket.id);
    //     if(users.length == 2){
    //         // 分配红蓝方
    //         for(let i = 0 ; i < users.length ; i ++){
    //             io.sockets.sockets[users[i]].emit('socketId',{id:users[i],role:roles[i],canChess:i == 0?true:false});
    //         }
    //     }
    // }
    // socket.emit('server_info', { hello: 'world' });

    // 监听棋子落子
    // socket.on('chess',function (data) {
    //     console.log(data);
    //     var send = data.id == users[0]?users[1]:users[0];
    //     io.sockets.sockets[send].emit('fresh',{chess:data.chess,next:data.role == 'blue'?'red':'blue'});
    // })

    // 客户端断开连接
    // socket.on("disconnect", function() {
    //
    //     var index = users.indexOf(this.id);
    //     if(index < 0){
    //         console.log("a user go out");
    //     }else{
    //         users.splice(index,1);
    //         if(users.length!=0){
    //             console.log(users[0]);
    //             io.sockets.sockets[users[0]].emit('someone_disconnect',{info:'对手断开连接，请重新等待'});
    //         }
    //         console.log('a player go out');
    //     }
    // });

    // 监听移除的棋子
    // socket.on('eat',function (data) {
    //     console.log(data);
    //     var send = data.id == users[0]?users[1]:users[0];
    //     io.sockets.sockets[send].emit('remove',{chess:data.chess});
    // })

    // 监听登录
    socket.on('login',function (data) {

        for(let i=0;i<connections.length;i++){
            if(this.id == connections[i].id){
                connections[i].username = data.name;
                break;
            }
        }
        io.sockets.sockets[this.id].emit('info',{info:'登录成功'});
        io.sockets.sockets[this.id].emit('connection_feedback',{info:'你已连接到象棋对战',rooms:rooms});
        console.log(connections);
    })

    // 监听用户创建房间
    socket.on('create_room',function (data) {
        var roomname = data.roomname;
        var i = this.id;
        var room = {
            name : roomname,
            id : i
        }
        rooms.push(room);
        io.sockets.sockets[this.id].emit('connection_feedback',{info:'你已连接到象棋对战',rooms:rooms});
        this.join(roomname);
    })
    // 监听用户加入房间
    socket.on('join',function (data) {
        this.join(data.roomname);
        io.to(data.roomname).emit('roominfo',{info:'你在房间:'+data.roomname});
    })

});



module.exports = router;