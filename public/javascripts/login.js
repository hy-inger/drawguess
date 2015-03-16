$(document).ready(function(){
	/*登录页面事件*/
	var login_mark = [];
	$('.login form .submit a').click(function(){
		var name = $('.login').find('form input[name="user"]').val();
		var pw = $('.login').find('form input[name="pw"]').val();
		$.ajax({
			url:'/login',
			type:'POST',
			data:{"name":name,"pw":pw},
			async:false,
			success:function(data){
				var message = data.message;
				switch(message){
					case 'pwerror':
						$('.login').find('em.pw').siblings('.error').show();
						$('.login').find('em.user').siblings('.error').hide();
						break;
					case 'nouser':
						$('.login').find('em.user').siblings('.error').show();
						break;
					case 'ok':
						$('.login').find('.error').hide();
						window.location.replace('http://localhost:3000/room/hall');
						break;
				}
			}

		});
	});

	/*注册页面事件*/
	var mark = [];
	var username,password;
	$('.register input[name="name"]').blur(function(){
		var val = $(this).val();
		var $this = $(this);
		if(val!='' && (val.length < 2 || val.length > 64)){
			$(this).siblings('.error').text('用户名长度不正确！').show();
		} else {
			$(this).siblings('.error').hide();
			$.ajax({
				url:'/register/user?name='+val,
				type:'GET',
				success:function(data){
					if(data.message == 'exist'){
						$this.siblings('.error').text('用户名已存在！').show();
					} else {
						$this.siblings('.error').hide();
						mark.push(true);
						username = val;
					}
				}
			});	
		}
	});
	$('.register input[name="ackn_pw"]').blur(function(){
		var pw = $('.register input[name="password"]').val();
		var ackn_pw = $(this).val();
		if(ackn_pw != pw)
			 $(this).siblings('.error').text('密码不一致！').show();
		else if(ackn_pw.length<6 || ackn_pw.length>64)
			$(this).siblings('.error').text('密码长度不正确！').show();
		else{
			$(this).siblings('.error').hide();
			mark.push(true);
			password = ackn_pw;
		}
	});
	
	$('.register form .submit a').click(function(){
		if(mark.length == 2){
			$('#register').ajaxSubmit({
				type:'POST',
				url:'/register/action',
				async:false,
				success:function(data){
					console.log(data);
					if(data.message == 'success'){
						window.location.replace('http://localhost:3000/room/hall');				
					}
										
				},
				error:function(data){
					alert('注册失败，请稍后再试。');
				}
			});
		}
	});	
});