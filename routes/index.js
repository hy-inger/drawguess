var express = require('express');
var router = express.Router();
var User = require('../database/db').user;
var server = require('http').createServer(router);
server.listen(80);
var io = require('socket.io').listen(server);

/* GET home page. */
router.get('/', function(req, res) {
	User.find(function(err,docs){//查询数据库的数据
		res.render('index', { title: 'index' ,user:docs});
	});
　　
});

/*add*/
router.get('/room/painting', function(req, res) {
　　res.render('room/painting');

});

io.on('connection',function(socket){
	socket.emit('open');
	var client = {
		socket:socket,
		name:'huangying',
		color:'red'
	};
	socket.on('message',function(msg){
		var obj = {time:getTime(),color:client.color,name:client.name};
		console.log(client.name+":"+msg);
		socket.emit('message',obj);
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