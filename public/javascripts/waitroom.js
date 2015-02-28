
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
	var owner = document.cookie;
	owner = owner.split('=')[1];
	var user_info = $('.world_chat .user_info'),
 		name = user_info.find('h4').text(),
		headimg = user_info.find('img').attr('src'),
		sex = user_info.attr('_sex'),
		score = user_info.find('.score span').text(),
		flower = user_info.find('.flower span').text(),
		popular = user_info.find('.popular span').text(),
		roomid = $('.player_list .top h1').text();
		roompw = $('.player_list .top .roompass input[type="checkbox"]').prop('checked') || false;
		num = $('.player_list .players').attr('_num');
	socket = io.connect('ws://localhost',{
 		transports: ['websocket'],
 		"try multiple transports": false,
 		reconnect: true
 	});
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
	$(document).on('mouseenter mouseleave','.player_list .players ul li',function(event){
		$(this).find('.per_info').toggle();
		event.stopPropagation();
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
	/*用户离开房间*/
	$('.player_list .leaveroom').click(function(){
		socket.emit('leaveRoom',{'name':name,'roomid':roomid,'owner':owner});
		$.ajax({
			url:'/room/leave',
			type:'POST',
			data:{'name':name,'owner':owner,'roomid':roomid},
			success:function(data){
				window.location.replace('/room/hall');
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
				return false;
			}
		});
	});
	//用户离开房间广播
	socket.on('leaveRoom',function(data){
		console.log(data);
		var name = data.name,
			owner = data.owner,
			players_li = $('.player_list .players ul li');
		players_li.each(function(i){
			if($(this).children('h4').text()  == name){
				//$(this).replaceWith('<li><img class="waiting" src=""><span>等待玩家</span><h4></h4></li>');
				$(this).before('<li><img class="waiting" src=""><span>等待玩家</span><h4></h4></li>');
				$(this).remove();
				return false;
			}
		});
		if(owner == 'true'){
			for(var j = 0;j < players_li.length;j++){					
				if(players_li.eq(j).find('.owner').length <= 0){
					players_li.eq(j).children('img').before('<p class="owner"><em></em>房主</p>');
					return false;
				}	
			}
		}
	});
	
	var countdown = setInterval(function(){
		var time = $('.player_list .top .countdown').text();
		time = parseInt(time);
		time--;
		$('.player_list .top .countdown').text(time);
		if(time <= 0)
			clearInterval(countdown);
	},1000);
});