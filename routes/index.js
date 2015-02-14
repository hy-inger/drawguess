var express = require('express');
var router = express.Router();
var User = require('../database/db').user;
var server = require('http').createServer(router);
server.listen(80);
var io = require('socket.io').listen(server);
io.set('transports', [ 'websocket','flashsocket','htmlfile','xhr-polling','jsonp-polling','polling']);
/* GET home page. */
router.get('/', function(req, res) {
	User.find(function(err,docs){//查询数据库的数据
		res.render('index', { title: 'index' ,user:docs});
	});
　　
});

/*room*/
router.get('/room/painting', function(req, res) {
　　res.render('room/painting');

});

/*与客户端通信传送消息*/
io.sockets.on('connection',function(socket){
	socket.emit('open');
	var client = {
		socket:socket,
		name:'huangying',
		color:'red'
	};
	socket.on('message',function(msg){		//收到客户端发送来的消息。msg为数据。
		console.log(msg);
		if(msg.mx)
			socket.broadcast.emit('begin',msg);
		if(msg.type == 'pencil')
			socket.broadcast.emit('drawing',msg);			//将数据广播给除发送消息过来的用户的其他用户，参数为消息名和数据。
		else if(msg.type == 'eraser')
			socket.broadcast.emit('earse',msg);
		else if(msg.type == 'empty')
			socket.broadcast.emit('empty',msg);

	});
	socket.on('my event',function(msg){
		console.log(msg);
	});
	socket.on('disconnect',function(){
		console.log(client.name+':disconnect');
	});
});

var getTime=function(){
  var date = new Date();
  return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

module.exports = router;