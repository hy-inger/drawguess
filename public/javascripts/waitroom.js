$(document).ready(function(){
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
			p.hide().siblings('span.pass').show();
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
		$(this).hide().siblings('p').css('display','inline-block');
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
		console.log(event);
		$(this).find('.per_info').toggle();
		event.stopPropagation();
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