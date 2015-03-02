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
			var user = docs[0];
			req.session.user = {};
			req.session.user.name = user.name;
			req.session.user.headimg = user.headimg;
			req.session.user.sex = user.sex;
			req.session.user.score = user.score;
			req.session.user.flower = user.flower;
			req.session.user.popular = user.popular;
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
			var user = docs[0];
			if(docs[0].password == pw){
				req.session.user = {};
				req.session.user.name = user.name;
				req.session.user.headimg = user.headimg;
				req.session.user.sex = user.sex;
				req.session.user.score = user.score;
				req.session.user.flower = user.flower;
				req.session.user.popular = user.popular;
				console.log(req.session.user);
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
	req.session.destroy();
	res.jsonp({'message':'ok'});
});
/*进入世界大厅获取各房间信息*/
router.get('/room/hall',checkLogin);
router.get('/room/hall',function(req,res){
	var name = req.session.user.name;
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
		Room.find(function(err,docs){
			if(docs.length){
				docs.sort({"_id":1});
				docs = docs.slice(0,6);
				for(var i = 0 ;i < docs.length; i++){
					var num = parseInt(docs[i].playernum);
					if(docs[i].user.length < num);
						docs[i].user.length = num;
				}
				
			}
			res.render('room/hall',{'item':docs,'user':user});
		});
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
/*用户加入房间，数据加入房间数据库*/
router.get('/room/playerEnter',function(req,res){
	var roomid = req.query.roomid,
		roompw = req.query.roompw || '';
	Room.find({'roomid':roomid},function(err,docs){
		//var user = docs[0].user;
		if(roompw && docs[0].roompw != roompw){
			res.jsonp({'message':'pwerror'});
		} else if((roompw && docs[0].roompw == roompw) || !roompw){
			var data = {
				name:req.session.user.name,
				sex:req.session.user.sex,
				headimg:'../'+req.session.user.headimg,
				score:req.session.user.score,
				flower:req.session.user.flower,
				popular:req.session.user.popular,
				owner:false
			};
			Room.update({'roomid':roomid},{'$push':{'user':data}},function(err,docs){
				res.cookie('owner',false);
				res.jsonp({'message':'success'});
			});
		}
	});

});
/*用户创建房间*/
router.post('/room/create',function(req,res){
	var num = req.body.num,
		roomid;
	Room.count(function(err,docs){
		roomid = '00'+docs;
		var room = new Room({
			roomid : roomid,
			roompw : req.body.pw,
			playernum : num,
			user : [{
				name:req.session.user.name,
				sex:req.session.user.sex,
				headimg:'../'+req.session.user.headimg,
				score:req.session.user.score,
				flower:req.session.user.flower,
				popular:req.session.user.popular,
				owner:true
			}]
		});
		room.save(function(err,docs){
			req.session.roompw = req.body.pw;
			res.cookie('owner',true);
			res.jsonp({message:'success',roomid:roomid});
		});
	});

});
/*进入等待房间*/
router.get('/room/waitroom',checkLogin);
router.get('/room/waitroom',function(req,res){
	var name = req.session.user.name;
	var roompw = req.session.roompw;
	var user,players,
		num = req.query.num || 7,
		owner = true;
	Room.find({'roomid':req.query.roomid},function(err,docs){
		if(docs.length){
			if(req.cookies.owner!='true'){
				num = docs[0].playernum;
				owner = false;				
			}
			players = docs[0].user;
			User.find({'name':name},function(err,docs){
				user = {
					'roomid':req.query.roomid,
					'num':parseInt(num),
					'roompw':roompw,
					'name':docs[0].name,
					'headimg':docs[0].headimg,
					'sex':docs[0].sex,
					'score':docs[0].score,
					'flower':docs[0].flower,
					'popular':docs[0].popular,
					'owner' : owner
				};
				res.render('room/waitroom',{user:user,players:players,num:num});
				
			});
		} else {
			res.redirect('/room/hall');
		}
	});
		

});
//用户离开房间
router.post('/room/leave',function(req,res){
	var roomid = req.body.roomid,
		name = req.body.name,
		owner;
	Room.find({'roomid':roomid},function(err,docs){
		var user = docs[0].user;
		for(var i = 0; i<user.length;i++){
			if(user[i].name == name){
				owner = user[i].owner;
				user.splice(i,1);
			}
		}
		if(user.length){
			if(owner){
				user[0].owner = true;
			}
			Room.update({'roomid':roomid},{'$set':{user:user}},function(err,docs){
				res.clearCookie('owner');
				res.jsonp({'message':'add'});
			});
		} else {
			Room.remove({'roomid':roomid},function(err,docs){
				res.jsonp({'message':'delete'});
			});
		}
	});
	
});
/*房主改变房间可进入人数*/
router.get('/room/AddPlayer',function(req,res){
	var roomid = req.query.roomid;
	Room.find({roomid:roomid},function(err,docs){
		var num = docs[0].playernum;
		num = parseInt(num);
		num ++;
		Room.update({'roomid':roomid},{'$set':{playernum:num}},function(err,docs){
			res.jsonp({'message':num});
		});
	});
});
router.get('/room/ReducePlayer',function(req,res){
	var roomid = req.query.roomid;
	Room.find({roomid:roomid},function(err,docs){
		var num = docs[0].playernum;
		num = parseInt(num);
		num --;
		Room.update({'roomid':roomid},{'$set':{playernum:num}},function(err,docs){
			res.jsonp({'message':num});
		});
	});
});
/*进入游戏房间*/
router.get('/room/painting',checkLogin);
router.get('/room/painting', function(req, res) {
	var name = req.session.user.name,
		roomid = req.query.roomid;
	Room.find({'roomid':roomid},function(err,docs){

	});
	User.find({'name':name},function(err,docs){
		user = {
			'name':docs[0].name,
			'headimg':docs[0].headimg,
			'sex':docs[0].sex,
			'score':docs[0].score,
			'flower':docs[0].flower,
			'popular':docs[0].popular
		};
		res.render('room/painting',{user:user});
	});
　　
});

/*与客户端通信传送消息*/
var client = {};
var joinRoom = [];
var heartbeat = 0;
var linknum = 0;
//var socket = io.connect();
io.sockets.on('connection',function(socket){
	socket.emit('open',{'message':'sss'});
	linknum ++ ;
	//console.log(linknum);
	socket.on('joinWaitRoom',function(msg){ 
		var roomid = msg.roomid;
		socket.broadcast.emit('reload',{name:msg.name});
		socket.join(msg.roomid);//刷新相当于断开重连，每次的socket.id不同。所以每次都要重新加入room.bug之一。
		joinRoom.push({id:'room'+socket.id,name:msg.name,roomid:msg.roomid,owner:msg.owner,joinid:socket.join().id});
		if(!client[roomid])
		  client[roomid] = [];
		var i ;
		for(i = 0; i < client[msg.roomid].length ; i++){
		  if(client[msg.roomid][i] == msg.name)
		    return false; 
		}
		if(i == client[msg.roomid].length){
		  //console.log(msg.name);
		  client[msg.roomid].push(msg.name);
		  socket.broadcast.to(msg.roomid).emit('joinWaitRoom',msg);//用户进入房间广播给同房间用户
		  socket.broadcast.emit('joinRoomToHall',msg);    //用户进入房间广播给世界用户
		}

	});
	socket.on('sendInRoom',function(msg){     //用户发送聊天消息房间内广播
		console.log(msg.roomid);
		socket.broadcast.to(msg.roomid).emit('receiveInRoom',msg);
	});
	socket.on('sendInHall',function(msg){     //用户发送聊天消息大厅广播
		console.log(msg.roomid);
		socket.broadcast.emit('receiveInHall',msg);
	});
	socket.on('AddPlayer',function(msg){      //用户更改房间游戏人数广播
		socket.broadcast.to(msg.roomid).emit('AddInRoom',msg);
		socket.broadcast.emit('AddInHall',msg);
	});
	socket.on('ReducePlayer',function(msg){
		socket.broadcast.to(msg.roomid).emit('ReduceInRoom',msg);
		socket.broadcast.emit('ReduceInHall',msg);
	});
	socket.on('leaveRoom',function(msg){    //用户离开房间消息广播。
		for(var i = 0;i < client[msg.roomid].length ; i++){
			if(client[msg.roomid][i] == msg.name){
				client[msg.roomid].splice(i,1);
			}
		}
		for(var j = 0;j < joinRoom.length;j++){
			if(joinRoom[j].id == ('room'+socket.id))
				joinRoom.splice(j,1);
		}
		if(msg.joinid){
			
			socket.join().id = msg.joinid;
		}
		socket.broadcast.to(msg.roomid).emit('leaveInRoom',msg);
		socket.broadcast.emit('leaveRoomToHall',msg);
		socket.leave(msg.roomid); 
	});
	socket.on('message',function(msg){    //收到客户端发送来的消息。msg为数据。
	if(msg.mx)
		socket.broadcast.emit('begin',msg);
	if(msg.type == 'pencil')
		socket.broadcast.emit('drawing',msg);     //将数据广播给除发送消息过来的用户的其他用户，参数为消息名和数据。
	else if(msg.type == 'eraser')
		socket.broadcast.emit('earse',msg);
	else if(msg.type == 'empty')
		socket.broadcast.emit('empty',msg);

	});
	socket.on('disconnect',function(msg){
		console.log(':disconnect');
		linknum -- ;
		//console.log(linknum);
		for(var i = 0;i < joinRoom.length;i++){
			if(joinRoom[i].id == ('room'+socket.id)){
				console.log('dis');
				console.log(joinRoom[i]);
				socket.broadcast.emit('roomdiscon',joinRoom[i]);
				joinRoom.splice(i,1);
			}
		}
	});
	socket.on('closeToRemove',function(msg){
		console.log('close:'+msg);
	})
});

function checkLogin(req,res,next){
	if(!req.session.user){
		return res.redirect('/');
	}
	next();
}

module.exports = router;