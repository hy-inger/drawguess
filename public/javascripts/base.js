//世界公屏聊天消息。

	socket = io.connect('ws://localhost',{
	 		transports: ['websocket'],
	 		"try multiple transports": false,
	 		reconnect: true
	 	});	
	var user_info = $('.world_chat .user_info'),
 		name = user_info.find('h4').text(),
		headimg = user_info.find('img').attr('src'),
		sex = user_info.attr('_sex'),
		score = user_info.find('.score span').text(),
		flower = user_info.find('.flower span').text(),
		popular = user_info.find('.popular span').text();
		roomid = $('.player_list .top h1').text() || '';
	$(document).on('mouseenter mouseleave','.world_hall .room_list ul li .online ul li,.world_chat .chat_area .chat ul li .sender img,.player_list .players ul li,.riddler ul li',function(event){
		if($(this).parent('.sender').length){
			$(this).siblings('.per_info').toggle();
		} else {
			$(this).find('.per_info').toggle();
		}
		event.stopPropagation();
	});
	function sendMess(obj,val){
		var reg = /\[s([\u4E00-\u9FA5\uF900-\uFA2D]|\w)+\]/g,
			emotionArr = val.match(reg) || '';
		for(var i = 0;i < emotionArr.length;i ++){
			var emo_text = emotionArr[i];
			for(var j = 0;j < emosion.length; j++){
				if(emo_text == emosion[i].text){
					val = val.replace(emo_text,'<img src="'+emosion[i].imgsrc+'"/>');
				}
			}
		}
		var data = {
			'name' : name,
			'headimg' : headimg,
			'sex' : sex,
			'score' : score,
			'flower' : flower,
			'popular' : popular,
			'sendmess' : val,
		};		
		obj.parents('.chat_area').find('.chat ul').append(template('chat_list',data));
		emosion = [];
		if(roomid){
			data.roomid = roomid;
			socket.emit('sendInRoom',data);
		} else {
			socket.emit('sendInHall',data);
		}
	}
	var emosion = [];
	$('.world_chat .chat_area .send ul li').click(function(){	//选择表情
		var text = $(this).attr('_text'),
			imgsrc = $(this).find('img').attr('src');
			val = $('.world_hall .world_chat .chat_area .send input').val(),
		$('.world_chat .chat_area .send input').val(val+text);
		emosion.push({text:text,imgsrc:imgsrc});
	});
	$('.world_chat .chat_area .send a').click(function(){	//发送聊天消息
		$(this).siblings('ul').hide();
		var	sendmess = $(this).siblings('input').val();
		sendMess($(this),sendmess);
		$(this).siblings('input').val('');
	});
	$('.world_chat .chat_area .send input').keyup(function(event){
		if(event.keyCode == 13){
			var sendmess = $(this).val();
			sendMess($(this),sendmess);
			$(this).val('');
		}
	});
	/*用户退出账号，清除session记录*/
	$('.logout').click(function(){
		$.ajax({
			url:'/logout',
			type:'GET',
			success:function(data){
				window.location.replace('/');
			}
		});
	});
	socket.on('open',function(data){
		//console.log(data);
	});
	socket.on('roomdiscon',function(msg1){		//用户刷新或关闭页面时socket连接断开
		var name = msg1.name,
			roomid = msg1.id,
			reload = false;
		console.log(msg1);
		socket.on('reload',function(msg2){		//刷新后会重新连接
			if(msg2.name == name)
				reload = true;
			console.log('reload:'+reload);
		});
		setTimeout(function(){					//在一定时间
			console.log(msg1);
			if(!reload){
				$.ajax({
					url:'/room/leave',
					type:'POST',
					data:msg1,
					success:function(data){
						socket.emit('leaveRoom',msg1);
					}
				});
			}
		},3000);
		
	});
	