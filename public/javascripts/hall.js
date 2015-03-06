$(document).ready(function(){
 	/*var user_info = $('.world_chat .user_info'),
 		name = user_info.find('h4').text(),
		headimg = user_info.find('img').attr('src'),
		sex = user_info.attr('_sex'),
		score = user_info.find('.score span').text(),
		flower = user_info.find('.flower span').text(),
		popular = user_info.find('.popular span').text();*/
	$('.emosion').click(function(){
		$(this).siblings('ul').toggle();
	});
	$('.world_chat .chat_area .send input').click(function(){
		$(this).siblings('ul').hide();
	});
	
	
	/*世界大厅上下页切换*/
	$('.world_hall .room_list .operate em').click(function(){
		var $this = $(this);
		var operate = $(this).attr('_type');
		var page = $(this).attr('_page');
		if(page == '1' && operate == '1')
			return;
		if(operate == '2' && $('.world_hall .room_list ul.about_room>li').length < 6)
			return;
		$.ajax({
			url:'/room/switchList?operate=' + operate + '&page=' + page,
			type:'GET',
			success:function(data){
				if(data.length == 0)
					return;
				for(var i = 0 ;i < data.length; i++){
					if(data[i].user.length < 7);
						data[i].user.length = 7;
				}
				var html = template('room_list',{'list':data});
				$('.world_hall .room_list ul.about_room').html(html);
				page = parseInt(page);
				if(operate == '1') page -= 1;
				else page += 1;
				$this.attr('_page',page);
				$this.siblings('em').attr('_page',page);
			}
		});

	});

	//用户创建房间
	var create = false,
		enterroom = '';
	$('.poptip ul li').click(function(){
		if(!$(this).hasClass('current')){
			$(this).addClass('current').siblings('li').removeClass('current');
		}
	});
	$('.poptip .button .cancel').click(function(){
		$(this).parents('.poptip').slideUp('fast');
		create = false;
	});	
	$('.world_hall .operate .create').click(function(){
		$('.poptip').slideDown('fast').find('.create').show();
		create = true;
	});
	$('.poptip .certain').click(function(){
		if(create){
			var poptip = $(this).parents('.poptip'),
				num = $('.poptip ul li.current').text(),
				pw='';
			if(poptip.find('p input[type="checkbox"]').prop('checked')){
				pw = poptip.find('p input[type="text"]').val();
			}
			ownerdata = {
				'num':num,
				'pw':pw,				
			};
			$.ajax({
				url:'/room/create',
				type:'POST',
				data:ownerdata,
				async:false,
				success:function(data){
					poptip.hide();
					window.location.replace('/room/waitroom?roomid=' + data.roomid +'&num=' + num);
				}
			});
		} else {
			var roompw = $('.poptip .enterpw input').val();
			var player_data = {
				'roomid' : enterroom,
				'roompw' : roompw
			}
			$.ajax({
				url:'/room/playerEnter',
				type:'GET',
				data:player_data,
				async:false,
				success:function(data){
					if(data.message == 'pwerror'){
						$('.poptip .enterpw p').show();
					} else if(data.message == 'success'){
						$('.poptip .enterpw p').hide();
						window.location.replace('/room/waitroom?roomid=' + enterroom);
					}											
				}	

			});
		}
	});
	/*用户加入房间*/
	$(document).on('click','.world_hall .room_list ul li .join_button',function(event){
		var $this = $(this);
		if($this.hasClass('unjoin'))
			return;

		var roomid = $this.siblings('.roomid').find('h1').text();
		var player_data = {
			'roomid':roomid,			
		};
		enterroom = roomid;
		if(!$this.siblings('.roomid').find('.lock').hasClass('hide')){	//房间有密码时需验证密码
			$('.poptip').slideDown('fast').find('.enterpw').show();
			create = false;
		} else{
			$.ajax({
				url:'/room/playerEnter',
				type:'GET',
				data:player_data,
				async:false,
				success:function(data){
					var length = $this.siblings('.online').find('ul li').length-1;
					$this.siblings('.online').find('ul li').each(function(i){
						if($(this).text()==''){
							if(i == length)
								$this.addClass('unjoin');					
							window.location.replace('/room/waitroom?roomid=' + roomid);
							return false;
						}
						
					});
						
				}	

			});
		}
		event.stopPropagation();
	});
	/*用户加入房间时广播给世界大厅其他用户*/
	socket.on('joinRoomToHall',function(data){
		var in_roomid = data.roomid;
		var index;
		if(data.owner == 'false'){
			$('.world_hall .room_list ul.about_room>li').each(function(i){
				var $this = $(this);
				var roomid = $(this).find('.roomid h1').text();
				if(in_roomid == roomid){
					var html = template('player_list',data);
					var length = $this.find('.online ul li').length -1;
					$this.find('.online ul li').each(function(i){
						if(!$(this).text()){
							$(this).before(html);
							$(this).remove();
							index = i;
							return false;
						}
					});
					if(index == length)
						$this.find('.join_button').addClass('unjoin'); 
					return false;
				}
			});
		} else {
			if($('.world_hall .room_list ul.about_room>li').length < 6){
				var num = parseInt(data.num);
				var data = {
					'list':{
						'roomid' :　data.roomid,
						'roompw' :  data.roompw,
						'user':[
							{'name' : data.name,
							'headimg' :data.headimg,
							'sex' :data.sex,
							'score' : data.score,
							'flower' : data.flower,
							'popular' : data.popular
						}]
					}
				};
				
				data.list.user.length = num;
				var html = template('room_list',{'list':data});
				$('.world_hall .room_list ul.about_room').append(html);
			}
		}
	});
	/*用户离开房间广播给世界*/
	socket.on('leaveRoomToHall',function(data){
		var name = data.name,
			roomid = data.roomid;
		$('.room_list ul li').each(function(){
			if(roomid == $(this).find('.roomid h1').text()){
				console.log($(this).find('.online ul li').eq(1).text());
				if(!$(this).find('.online ul li').eq(1).text()){
					$(this).remove();
				} else {				
					$(this).find('.online ul li').each(function(i){
						if($(this).attr('_username') == name){
							$(this).parent('ul').append('<li></li>');
							$(this).remove();
							
						}
					});
				}
			}
		});
	});
	/*用户更改房间游戏人数广播给世界其他用户*/
	socket.on('ReduceInHall',function(data){
		var roomid = data.roomid;
		$('.room_list ul li').each(function(){
			console.log($(this).find('.roomid h1').text());
			if(roomid == $(this).find('.roomid h1').text()){
				var length = $(this).find('.online ul li').length - 1;
				$(this).find('.online ul li').eq(length).remove();
			}
		});
	});
	socket.on('AddInHall',function(data){
		var roomid = data.roomid;
		$('.room_list ul li').each(function(){
			if(roomid == $(this).find('.roomid h1').text()){
				$(this).find('.online ul').append('<li></li>');
			}
		});
	});
	
	
	//用户接收广播聊天消息
	socket.on('receiveInHall',function(data){
		$('.world_chat .chat_area .chat ul').append(template('chat_list',data));
	});
});