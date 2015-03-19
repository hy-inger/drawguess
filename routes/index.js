var express = require('express');
var router = express.Router();
var User = require('../database/db').user;//用户表
var Room = require('../database/db').room;//房间表
var Word = require('../database/db').word;//词库表
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
			console.log(err);
		else {
			var user = docs;
			console.log(docs);
			req.session.user = {};
			req.session.user._id = user._id;
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
				req.session.user._id = user._id;
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
	Room.find().populate({path:'user',select:'name headimg score sex score flower popular',}).exec(function(err,docs){
		console.log(docs);
		var user = req.session.user;
		if(docs.length){
			docs.sort({"_id":1});
			docs = docs.slice(0,6);
			for(var i = 0 ;i < docs.length; i++){
				var num = parseInt(docs[i].playernum);
				if(docs[i].user.length < num);
					docs[i].user.length = num;
			}
		}
		User.find({name:req.session.user.name},function(err,doc){
			console.log(doc);
			var user = doc[0];
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
		Room.find().populate({path:'user',select:'name headimg score sex score flower popular',}).exec(function(err,docs){
			if(docs.length){
				docs.sort({"_id":1});
				docs = docs.slice(num,num+6);
				res.jsonp(docs);
			}
		});
	} else {							//operate = 1，向前翻页。
		var num = (page-2)*6; 		
		Room.find().populate({path:'user',select:'name headimg score sex score flower popular',}).exec(function(err,docs){
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
			var data = req.session.user._id;
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
		var user_id = req.session.user._id;
		console.log(user_id);
		var room = new Room({
			roomid : roomid,
			roompw : req.body.pw,
			playernum : num,
			ownername : req.session.user.name,				
			user:user_id
		});
		room.save(function(err,docs){
			console.log(docs);
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
	var players,
		num = req.query.num || 7,
		owner = true;
	Room.find({'roomid':req.query.roomid}).populate({path:'user',select:'name headimg score sex score flower popular',}).exec(function(err,docs){
		if(docs.length){
			res.cookie('owner',owner);
			if(docs[0].ownername != name){
				num = docs[0].playernum;
				owner = false;
				res.cookie('owner',owner);			
			}
			players = docs[0].user;	
			for(var i = 0;i < players.length;i++){
				if(players[i].name == docs[0].ownername){
					players[i].owner = true;
				}
			}
			User.find({name:name},function(err,doc){
				var user = doc[0];
				user.roomid = req.query.roomid;
				user.num = parseInt(num);
				user.roompw = roompw;
				user.owner = owner;	
				res.render('room/waitroom',{user:user,players:players,num:num});
			});
			
		} else {
			res.redirect('/room/hall');
		}
	})

});
//用户离开房间
router.post('/room/leave',function(req,res){
	var roomid = req.body.roomid,
		name = req.body.name,
		owner;
	Room.find({'roomid':roomid}).populate({path:'user',select:'name'}).exec(function(err,docs){
		console.log(docs);
		var user = docs[0].user;
		for(var i = 0; i<user.length;i++){
			if(user[i].name == name){
				user.splice(i,1);
			}
		}
		if(user.length){
			if(docs[0].ownername == name){
				docs[0].ownername = user[0].name;
			}
			Room.update({'roomid':roomid},{'$set':{user:user,ownername:docs[0].ownername}},function(err,docs){
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
var room_word = [];
router.get('/room/painting',checkLogin);
router.get('/room/painting', function(req, res) {
	var name = req.session.user.name,
		roomid = req.query.roomid,
		first_drawer = false,
		players = [],ownerimg = '',word = '',ownername;

	Room.find({'roomid':roomid}).populate({path:'user',select:'name headimg score sex score flower popular'}).exec(function(err,docs){
		ownername = docs[0].ownername;
		players = docs[0].user;
		for(var i = 0;i < players.length; i++){
			if(players[i].name == ownername){
				ownerimg = players[i].headimg;
				players[i].owner = true;
			}
		}
		if(ownername == name){
			first_drawer = true;
			var random = Math.floor(Math.random()*4);
			res.cookie('owner',true);
			Word.find(function(err,docs){
				word = docs[random].word;
				room_word.push({
					roomid:roomid,
					word:docs[random].word,
					tip1:docs[random].tip1,
					tip2:docs[random].tip2
				});
				User.find({name:name},function(err,doc){
					var user = doc[0];
					res.render('room/painting',{
						roomid:roomid,
						user:user,
						players:players,
						ownerimg:ownerimg,
						painter:ownername,
						first:first_drawer,
						word:word
					});
				});
			});
		} else {
			User.find({name:name},function(err,doc){
				var user = doc[0];
				res.render('room/painting',{
					roomid:roomid,
					user:user,
					players:players,
					ownerimg:ownerimg,
					painter:ownername,
					first:first_drawer,
					word:word
				});
			});
		}
	});
});
/*作画用户获取词语*/
router.get('/room/getWord',function(req,res){
	var roomid = req.query.roomid;
	var random = Math.floor(Math.random()*4);
	Word.find(function(err,docs){
		word = docs[random].word;
		for(var i = 0; i < room_word.length;i ++){
			if(room_word[i].roomid == roomid){
				room_word[i].word = docs[random].word;
				room_word[i].tip1 = docs[random].tip1;
				room_word[i].tip2 = docs[random].tip2;
				res.jsonp({'word':word});
			}
		}
	});
});
/*猜画用户获取提示*/
router.get('/room/getTip',function(req,res){
	var roomid = req.query.roomid,
		times = req.query.times,
		tip;
	for(var i = 0; i < room_word.length;i ++){
		if(room_word[i].roomid == roomid){
			if(times == 1)
				tip = room_word[i].tip1;
			else 
				tip = room_word[i].tip2;
			res.jsonp({'tip':tip});
			return false;
		}
	}
});
/*每局游戏结束时将用户积分礼物等存入数据库*/
router.get('/room/saveScore',function(req,res){
	var integral = req.query.integral;
	User.find(function(err,docs){
		var j = 0;
		docs.forEach(function(doc){
			console.log(j);
			for(var i = 0;i < integral.length;i++){
				if(doc.name == integral[i].name){
					doc.score += parseInt(integral[i].score);
					doc.flower += parseInt(integral[i].flower);
					doc.save();
					j++;
					return false;
				}			
			}
			console.log(doc);
			if(j == integral.length){
				return false;
			}
		});
	});
});
/*与客户端通信传送消息*/
var client = {};	//已进入房间的用户，用户再次刷新时不再向其他用户推送消息。
var joinRoom = [];	//保证用户刷新后仍然进入原来的房间，因为刷新后socket.id会改变。
var heartbeat = 0;
//var socket = io.connect();
io.sockets.on('connection',function(socket){
	socket.emit('open',{'message':'sss'});
	socket.on('joinWaitRoom',function(msg){ 
		var roomid = msg.roomid;
		socket.broadcast.emit('reload',{name:msg.name});
		socket.join(msg.roomid);//刷新相当于断开重连，每次的socket.id不同。所以每次都要重新加入。room.bug之一。
		joinRoom.push({id:'room'+socket.id,name:msg.name,roomid:msg.roomid,owner:msg.owner,joinid:socket.join().id});
		if(!client[roomid])
		  client[roomid] = [];
		var i ;
		console.log(client);
		for(i = 0; i < client[msg.roomid].length ; i++){
		  if(client[msg.roomid][i] == msg.name)
		    return false; 
		}
		console.log(i);
		if(i == client[msg.roomid].length){
		  client[msg.roomid].push(msg.name);
		  socket.broadcast.to(msg.roomid).emit('joinWaitRoom',msg);//用户进入房间广播给同房间用户
		  socket.broadcast.emit('joinRoomToHall',msg);    //用户进入房间广播给世界用户
		}
	});
	socket.on('sendInRoom',function(msg){     //用户发送聊天消息房间内广播
		if(msg.gameroom && !msg.drawer){
			for(var i = 0;i < room_word.length;i++){
				if(room_word[i].roomid == msg.roomid && room_word[i].word == msg.sendmess){
					socket.broadcast.to(msg.roomid).emit('receiveInRoom',{correct:true,name:msg.name});
					socket.emit('receiveInRoom',{correct:true,name:msg.name});
				} else {
					socket.broadcast.to(msg.roomid).emit('receiveInRoom',msg);
				}
			}
		} else {
			socket.broadcast.to(msg.roomid).emit('receiveInRoom',msg);
		}
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
		if(!!client[msg.roomid]){
			for(var i = 0;i < client[msg.roomid].length ; i++){
				if(client[msg.roomid][i] == msg.name){
					client[msg.roomid].splice(i,1);
				}
			}
		}
		for(var j = 0;j < joinRoom.length;j++){
			if(joinRoom[j].id == ('room'+socket.id))
				joinRoom.splice(j,1);
		}
		if(msg.joinid){	
			socket.join().id = msg.joinid;
		}
		if(room_word.length){
			for(var k = 0;k < room_word.length;k ++){
				if(room_word[k].roomid == msg.roomid){
					msg.answer = room_word[k].word;
				}
			}
		}
		socket.broadcast.to(msg.roomid).emit('leaveInRoom',msg);
		socket.broadcast.emit('leaveRoomToHall',msg);
		socket.leave(msg.roomid); 
	});
	//游戏开始
	socket.on('gameBegin',function(msg){				//从等待房间进入游戏房间。
		socket.broadcast.to(msg.roomid).emit('gameBeginInRoom',msg);
		socket.emit('gameBeginInRoom',msg);
		socket.broadcast.emit('gameBeginInHall',msg);
	});
	//进入游戏房间
	socket.on('GameRoom',function(msg){
		socket.broadcast.emit('reload',{name:msg.name});
		socket.join(msg.roomid);
	});
	//游戏结束，显示答案
	socket.on('answer',function(msg){
		console.log(msg);
		socket.broadcast.to(msg.roomid).emit('getAnswer',msg);
	});
	//游戏结束后返回到等待房间时，大厅房间恢复为可进入状态。
	socket.on('GameEnd',function(msg){
		socket.broadcast.emit('GameEndInHall',msg);
	});
	//每轮结束后玩家送礼
	socket.on('sendGift',function(msg){
		socket.broadcast.to(msg.roomid).emit('getGiftMess',msg);
		socket.emit('getGiftMess',msg);
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
		for(var i = 0;i < joinRoom.length;i++){
			if(joinRoom[i].id == ('room'+socket.id)){
				console.log('dis');
				console.log(joinRoom[i]);
				socket.broadcast.emit('roomdiscon',joinRoom[i]);
				joinRoom.splice(i,1);
			}
		}
	});
	
});

function checkLogin(req,res,next){
	if(!req.session.user){
		return res.redirect('/');
	}
	next();
}

module.exports = router;