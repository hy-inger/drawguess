var express = require('express');
var router = express.Router();
var User = require('../database/db').user;//用户表
var Room = require('../database/db').room;//房间表
var server = require('http').createServer(router);
server.listen(80);
var io = require('socket.io').listen(server);
io.set('transports', [ 'websocket','flashsocket','htmlfile','xhr-polling','jsonp-polling','polling']);
/* GET home page. */
router.get('/', function(req, res) {
	/*User.find(function(err,docs){//查询数据库的数据
		res.render('index', { title: 'index' ,user:docs});
	});*/
　　res.render('index', { title: 'index'});
});
/*注册页面*/
router.get('/register',function(req,res){
	res.render('register',{ title: 'index'});
});
router.get('/uploads',function(req,res){
	res.redirect('uploads/temp.png')
});

router.get('/register/user',function(req,res){
	var name = req.query.name;
	User.find({'name':name},function(err,docs){
		if(docs.length){
			res.jsonp({'message':'exist'});
		} else {
			res.jsonp({'message':'ok'});
		}
	});
});
router.post('/register/action',function(req,res){
	var  regis_user = new User({
		name : req.body.name,
		password : req.body.password,
		age : req.body.age,
		sex : req.body.sex,
		headimg : req.files.headimg.name,
		score : '0',
		flower: '0',
		popular: '0'
	});
	regis_user.save(function(err,docs){
		//res.status(200).sendFile(req.files.headimg.path,{ root: __dirname + '/..' });
		if(err)
			res.jsonp({'message':'error'});
		else {
			req.session.user = req.body.name;
			res.jsonp({'message':'success','headimg':req.files.headimg.name});
			
		}
	});
});
/*登录页面*/
router.post('/login',function(req,res){
	var name = req.body.name;
	var pw = req.body.pw;
	User.find({'name':name},function(err,docs){
		if(docs.length){
			if(docs[0].password == pw){
				req.session.user = name;
				res.jsonp({'message':'ok'});
			}
			else
				res.jsonp({'message':'pwerror'});
		} else {
			res.jsonp({'message':'nouser'});
		}
	});
});
router.get('/logout',function(req,res){
	req.session.user = null;
	res.jsonp({'message':'ok'});
});
/*进入世界大厅获取各房间信息*/
router.get('/room/hall',checkLogin);
router.get('/room/hall',function(req,res){
	var name = req.session.user;
	var user;
	User.find({'name':name},function(err,docs){
		user = {
			'name':docs[0].name,
			'headimg':docs[0].headimg,
			'sex':docs[0].sex,
			'score':docs[0].score,
			'flower':docs[0].flower,
			'popular':docs[0].popular
		};
	});	
	Room.find(function(err,docs){
		if(docs.length){
			docs.sort({"_id":1});
			docs = docs.slice(0,6);
			for(var i = 0 ;i < docs.length; i++){
				if(docs[i].user.length < 7);
					docs[i].user.length = 7;
			}
			res.render('room/hall',{'item':docs,'user':user});
		}
	});

});
//用户切换房间列表
router.get('/room/switchList',function(req,res){
	var page = parseInt(req.query.page);
	var operate = req.query.operate;
	if(operate == '2'){					//向后翻页
		var num = page*6; 		
		Room.find(function(err,docs){
			if(docs.length){
				docs.sort({"_id":1});
				docs = docs.slice(num,num+6);
				res.jsonp(docs);
			}
		});
	} else {							//operate = 1，向前翻页。
		var num = (page-2)*6; 		
		Room.find(function(err,docs){
			if(docs.length){
				docs.sort({"_id":1});
				docs = docs.slice(num,num+6);
				res.jsonp(docs);
			}
		});
	}

});
/*用户进入等待房间，数据加入房间数据库*/
router.get('/room/playerEnter',function(req,res){
	var roomid = req.query.roomid;
	Room.find({'roomid':roomid},function(err,docs){
		var user = docs[0].user;
		var data = {
			name:req.query.name,
			sex:req.query.sex,
			headimg:req.query.headimg,
			score:req.query.score,
			flower:req.query.flower,
			popular:req.query.popular
		};
		//user.push(data);
		Room.update({'roomid':roomid},{'$push':{'user':data}},function(err,docs){
			res.jsonp({'message':'success'});
		});
	});

});
/*等待房间*/
router.get('/room/waitroom',function(req,res){
	res.render('room/waitroom');
})
/*room*/
router.get('/room/painting', function(req, res) {
　　res.render('room/painting');

});

/*与客户端通信传送消息*/
io.sockets.on('connection',function(socket){
	socket.emit('open');
	socket.on('playerenter',function(msg){		//用户进入房间广播
		socket.broadcast.emit('playEnter',msg);
	});
	socket.on('sendMess',function(msg){			//用户发送聊天消息广播
		socket.broadcast.emit('receiveMess',msg);
	});
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
		console.log(':disconnect');
	});
});

function checkLogin(req,res,next){
	if(!req.session.user){
		return res.redirect('/');
	}
	next();
}

module.exports = router;