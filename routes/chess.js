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
    // connections.push({username:'',id:socket.id});
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
    socket.on('chess',function (data,callback) {
        console.log(data);
        var users = data.room.users;
        var send = data.id == users[0].id?users[1].id:users[0].id;
        io.sockets.sockets[send].emit('fresh',{chess:data.chess,next:data.role == 'blue'?'red':'blue'});
        callback();
    })

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
    socket.on('eat',function (data) {
        console.log(data);
        var users = data.room.users;
        var send = data.id == users[0].id?users[1].id:users[0].id;
        io.sockets.sockets[send].emit('remove',{chess:data.chess});
    })

    // 监听游戏结果，即结束将结果发送给房间内的另外一个角色
    socket.on('result',function (data) {
        console.log('111111111111',data.room);
        socket.broadcast.to(data.room.name).emit('get_result','');
    })

    // 监听登录
    socket.on('login',function (data) {
        var _this = this;

        connections.push({username:data.name,id:_this.id,isInRoom:false});
        io.sockets.sockets[this.id].emit('info',{info:'登录成功,游戏id为'+_this.id});
        io.sockets.sockets[this.id].emit('connection_feedback',{info:'你已连接到象棋对战',rooms:rooms});
        // console.log(connections);
    })

    // 监听用户创建房间
    socket.on('create_room',function (data) {
        var roomname = data.roomname;
        var i = this.id;
        var room = {
            name : roomname, // 房间名称
            id : i,          // 房间拥有者
            count: 1,        // 房间人数
            users:[getUserById(i)]
        }
        rooms.push(room);
        addLabelIsInRoom(i);
        console.log(connections);
        io.sockets.sockets[this.id].emit('create_feedback',{info:'你已创建房间，你是房主',room:room});
        this.join(roomname);
        // 需要广播信息，让其他用户更新房间列表（广播给全部客户端，不包括本客户端）
        // socket.broadcast.emit('fresh_rooms', {info:'房间信息更新',rooms:rooms});

        // 在房间内的用户不用更新房间列表
        for(let k = 0;k<connections.length;k++){
            if(!connections[k].isInRoom){
                io.sockets.sockets[connections[k].id].emit('fresh_rooms', {info:'房间信息更新',rooms:rooms});
            }
        }

    })
    // 监听用户加入房间
    socket.on('join',function (data) {
        this.join(data.roomname);
        // 相应的房间人数加1
        var _this = this;
        var curr_room = '';
        rooms = rooms.map(function (e) {
            if(e.name == data.roomname){
                e.count++;
                e.users.push(getUserById(_this.id));
                curr_room = e;
                return e;
            }
            return e;
        })
        // 加入房间内的客户端添加一个isInRoom的标记，断开连接或者退出房间的时候，去除标记
        addLabelIsInRoom(_this.id);
        console.log(connections);
        // 给房间内的其他用户广播信息，某人加入房间（在房间内广播，不包含当前客户端）
        socket.broadcast.to(data.roomname).emit('roominfo',{info:'用户'+this.id+'加入房间：'+data.roomname});
        // 该房间内的用户更新房间内信息 （在房间内广播，包含当前客户端）
        io.sockets.in(data.roomname).emit('fresh_room_info', {info:'更新房间内信息',room:curr_room});
    })

    // 监听游戏开始
    socket.on('startGame',function (data) {

        var id = this.id;

        // 为两个客户端分配红蓝方
        // 先通过房主id找到房间信息
        var room = getRoomByOwnerId(id);
        for(let i = 0 ; i < room.users.length ; i ++){
            io.sockets.sockets[room.users[i].id].emit('socketId',{room:room,id:room.users[i].id,role:roles[i],canChess:i == 0?true:false});
        }
    })

});

// 通过username获取客户端信息
function getUserById(id) {
    for(let i=0 ;i<connections.length; i++){
        if(connections[i].id == id){
            return connections[i]
        }
    }
    return '';
}

function getRoomByOwnerId(id) {
    for(let i=0;i<rooms.length;i++){
        if(rooms[i].id == id){
            return rooms[i];
        }
    }
}

function addLabelIsInRoom(id) {
    for(let i = 0; i<connections.length;i++){
        if(connections[i].id == id){
            connections[i].isInRoom = true;
            return ;
        }
    }
}

module.exports = router;