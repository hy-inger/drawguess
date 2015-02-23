$(document).ready(function(){
	socket = io.connect('ws://localhost',{
 		transports: ['websocket'],
 		"try multiple transports": false,
 		reconnect: true
 	});
	$('.emosion').click(function(){
		$(this).siblings('ul').toggle();
	});
	$('.world_hall .world_chat .chat_area .send input').click(function(){
		$(this).siblings('ul').hide();
	});
	$('.world_hall .world_chat .chat_area .send ul li').click(function(){
		var text = $(this).attr('_text');
		var val = $('.world_hall .world_chat .chat_area .send input').val();
		$('.world_hall .world_chat .chat_area .send input').val(val+text);
	});
	$(document).on('mouseenter mouseleave','.world_hall .room_list ul li .online ul li,.world_hall .world_chat .chat_area .chat ul li .sender',function(event){
		$(this).find('.per_info').toggle();
		event.stopPropagation();
	});
	/*用户退出账号，清除session记录*/
	$('.logout').click(function(){
		$.ajax({
			url:'/logout',
			type:'GET',
			success:function(data){
				window.location.href = '/'
			}
		});
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
	
	/*用户加入房间*/
	$(document).on('click','.world_hall .room_list ul li .join_button',function(event){
		var $this = $(this);
		if($this.hasClass('unjoin'))
			return;
		var user_info = $('.world_chat .user_info');
		var player_data = {
			'roomid':$this.siblings('.roomid').find('h1').text(),
			'name':user_info.find('h4').text(),
			'headimg':user_info.find('img').attr('src'),
			'sex':user_info.attr('_sex'),
			'score':user_info.find('.score span').text(),
			'flower':user_info.find('.flower span').text(),
			'popular':user_info.find('.popular span').text(),
		};
		$.ajax({
			url:'/room/playerEnter',
			type:'GET',
			data:player_data,
			success:function(data){
				var html = template('player_list',player_data);
				$this.siblings('.online').find('ul li').each(function(i){
					if($(this).text()==''){
						$(this).before(html);
						$(this).remove();
						socket.emit('playerenter',{'player':player_data,'index':i});
						return false;
					}
				});
				
			}	

		});
		event.stopPropagation();
	});
	socket.on('playEnter',function(data){
		var in_roomid = data.player.roomid;
		var index = data.index;
		$('.world_hall .room_list ul.about_room>li').each(function(i){
			var $this = $(this);
			var roomid = $(this).find('.roomid h1').text();
			if(in_roomid == roomid){
				var html = template('player_list',data.player);
				$this.find('.online ul li').eq(index).before(html).remove();
			} 
		});
	});
});