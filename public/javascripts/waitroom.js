
$(document).ready(function(){
	/*if (window.history && window.history.pushState) {
		$(window).on('popstate', function () {
			alert(1);
			var hashLocation = location.hash;
			var hashSplit = hashLocation.split("#!/");
			var hashName = hashSplit[1];
			if (hashName !== '') {
				var hash = window.location.hash;
				if (hash === '') {
					alert("Back button isn't supported. You are leaving this application on next clicking the back button");
				}
			}
		});
		window.history.pushState('forward', null, './#forward');
	}*/
	owner = document.cookie;
	owner = owner.split('=')[1];
	 	/*user_info = $('.world_chat .user_info'),
 		name = user_info.find('h4').text(),
		headimg = user_info.find('img').attr('src'),
		sex = user_info.attr('_sex'),
		score = user_info.find('.score span').text(),
		flower = user_info.find('.flower span').text(),
		popular = user_info.find('.popular span').text(),
		//roomid = $('.player_list .top h1').text();*/
	var	roompw = $('.player_list .top .roompass input[type="checkbox"]').prop('checked') || false;
		num = $('.player_list .players').attr('_num');
 	//用户进入等待房间，给服务端发送实时消息。
 	var player_data = {
			'roomid':roomid,
			'name':name,
			'headimg':headimg,
			'sex':sex,
			'score':score,
			'flower':flower,
			'popular':popular,
			'owner':owner,
			'roompw':roompw,
			'num':num
		};
 	socket.emit('joinWaitRoom',player_data);

	$('.player_list .top .roompass input[type="checkbox"]').click(function(){
		if($(this).prop('checked')){
			var random = parseInt(Math.random()*10000);
			$(this).siblings('p').css('display','inline-block').find('input').val(random);
		} else {
			$(this).siblings('p').hide().siblings('span.pass').hide();
		}
	});
	$('.player_list .top .roompass a.cancel').click(function(){
		var p = $(this).parent('p');
		if(p.siblings('span.pass').text()!=''){
			p.hide().siblings('span.pass').css('display','inline-block');
		} else {
			p.hide().siblings('input[type="checkbox"]').prop('checked',false);
		}
	});
	$('.player_list .top .roompass a.certain').click(function(){
		var val = $(this).siblings('input').val();
		if(val !=''){
			$(this).parent('p').hide().siblings('span.pass').text(val).show();
		}
	});
	$('.player_list .top .roompass span.pass').click(function(){
		$(this).hide().siblings('p').css('display','inline-block').find('input').val($(this).text());
	});
	$('.player_list .top .action p a.addtime').click(function(){
		var time = $('.player_list .top .countdown').text();
		time = parseInt(time);
		time +=15;
		if(time > 60)
			time = 60;
		 $('.player_list .top .countdown').text(time);
	});
	//改变房间可进入人数。
	$('.player_list .players ul li').click(function(){
		var img = $(this).children('img');
		if(img.hasClass('forbid')){
			img.css('background','#ddc9a8').removeClass('forbid').addClass('waiting').siblings('span').show();
			$.ajax({
				url:'AddPlayer',
				type:'GET',
				data:{'roomid':roomid},
				success:function(data){
					socket.emit('AddPlayer',{roomid:roomid});
				}
			});
		} else if(img.hasClass('waiting')){
			img.css('background-image','url("../images/forbid1.png")').removeClass('waiting').addClass('forbid').siblings('span').hide();
			$.ajax({
				url:'ReducePlayer',
				type:'GET',
				data:{'roomid':roomid},
				success:function(data){
					socket.emit('ReducePlayer',{roomid:roomid});
				}
			});
		}
	});
	socket.on('AddInRoom',function(msg){
		$('.player_list .players ul li').each(function(){
			if($(this).children('img').hasClass('forbid')){
				$(this).children('img').css('background','#ddc9a8').removeClass('forbid').addClass('waiting').siblings('span').show();
				return false;
			}
		});
	});
	socket.on('ReduceInRoom',function(msg){
		$('.player_list .players ul li').each(function(){
			if($(this).children('img').hasClass('waiting')){
				$(this).children('img').css('background-image','url("../images/forbid1.png")').removeClass('waiting').addClass('forbid').siblings('span').hide();
				return false;
			}
		});
	});
	
	//用户加入房间广播
	socket.on('joinWaitRoom',function(data){
		$('.player_list .players ul li').each(function(){
			if($(this).find('.per_info').length <= 0){			
				var html = template('player_list',data);
				$(this).before(html);
				$(this).remove();
				data.sendmess = '大家好。我来啦。(进入房间)。';
				$('.world_chat .chat_area .chat ul').append(template('chat_list',data));
				return false;
			}
		});
	});
	//用户离开房间广播
	socket.on('leaveInRoom',function(data){
		var leave_name = data.name,
			leave_owner = data.owner,
			players_li = $('.player_list .players ul li');
		players_li.each(function(i){
			if($(this).children('h4').text()  == leave_name){				
				var html = template('player_list',data);
				$(this).before('<li><img class="waiting" src=""><span>等待玩家</span><h4></h4></li>');
				$(this).remove();
				data.sendmess = '大家再见。我走啦。(退出房间)。';
				$('.world_chat .chat_area .chat ul').append(template('chat_list',data));
				return false;
			}
		});
		if(leave_owner == 'true'){
			for(var j = 0;j < players_li.length;j++){					
				if(players_li.eq(j).find('.owner').length <= 0){
					players_li.eq(j).children('img').before('<p class="owner"><em></em>房主</p>');
					if(players_li.eq(j).children('h4').text() == name){
						$('.player_list .top .action').removeClass('hide');
						owner = 'true';
					}
					return false;
				}	
			}
		}
	});
	//用户接受聊天消息广播
	socket.on('receiveInRoom',function(data){
		console.log(data);
		$('.world_chat .chat_area .chat ul').append(template('chat_list',data));
	});
	//房间倒计时
	var countdown = setInterval(function(){
		var time = $('.top .countdown').text();
		time = parseInt(time);
		time--;
		$('.top .countdown').text(time);
		if(time <= 0){
			//socket.emit('gameBegin',{roomid:roomid,ownername:name});
			//window.location.replace('/room/painting?roomid=' + roomid + '&ownername=' + name);
			clearInterval(countdown);
		}
	},1000);
	//进入游戏房间，开始游戏
	$('.player_list .top .action a.begin').click(function(){
		socket.emit('gameBegin',{roomid:roomid,ownername:name});
		//window.location.replace('/room/painting?roomid=' + roomid + '&ownername=' + name + '&ownerimg' + headimg);
	});	
	socket.on('gameBeginInRoom',function(data){
		window.location.replace('/room/painting?roomid=' + data.roomid);
	});
});