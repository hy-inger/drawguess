function Draw(canvasObj){
	var mouseX,mouseY,mx,my;
	var isDraw = false;
	var ctx = canvasObj.getContext('2d');
	var type = "pencil";
	var begin = {};
	var drawer = false;
	socket = io.connect('ws://localhost',{
 		transports: ['websocket'],
 		"try multiple transports": false,
 		reconnect: true
 	});
 	socket.emit('GameRoom',{roomid:roomid,name:name});
	socket.on('open',function(){
	  console.log('连接成功');
	});
	socket.on('message',function(json){
	  console.log(json);
	});
	socket.on('begin',function(data){
		begin.mx = data.mx;
		begin.my = data.my;
	});
	socket.on('drawing',function(data){
		mouseX = data.mouseX;
		mouseY = data.mouseY;
		type = data.type;
		ctx.lineWidth = data.linewidth;
		ctx.shadowColor = ctx.strokeStyle = data.color;
		ctx.shadowBlur = 1;
		ctx.globalCompositeOperation = 'source-over';
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(begin.mx,begin.my);
		ctx.lineTo(mouseX,mouseY);
		ctx.closePath();
		ctx.stroke();
		begin.mx = mouseX;
		begin.my = mouseY;
	});
	socket.on('earse',function(data){
		ctx.globalCompositeOperation = 'destination-out';
		ctx.save();
		ctx.beginPath();
		ctx.arc(data.mouseX,data.mouseY,10,0,2*Math.PI);
		ctx.fill();
		ctx.restore();
	});
	socket.on('empty',function(data){
		console.log(data);
		ctx.clearRect(0,0,canvasObj.width,canvasObj.height);
	});
	ctx.shadowBlur = 3;
	ctx.lineJoin = ctx.lineCap = "round";//线条末端样式
	this.setlineWidth = function(lw){
		ctx.lineWidth = lw;
	}
	this.setcolor = function(sc){		
		ctx.strokeStyle = sc;//修改画笔颜色
		ctx.shadowColor = sc;//修改线条阴影颜色
	}
	this.settype = function(st){
		type = st;
	}
	this.emptyCanvas = function(){
		ctx.clearRect(0,0,canvasObj.width,canvasObj.height);
	}
	this.setDrawer = function(isDrawer){
		drawer = isDrawer;
	}
	//获取鼠标click或move的坐标
	var coordinate = function(e){
		function getTop(e){
		    var offset = e.offsetTop;
		    if (e.offsetParent != null)
		        offset += getTop(e.offsetParent);
		    return offset;
		}
		function getLeft(e){
		    var offset = e.offsetLeft;
		    if (e.offsetParent != null)
		        offset += getLeft(e.offsetParent);
		    return offset;
		}
		canvasLeft = getLeft(canvasObj);
		canvasTop = getTop(canvasObj)
		mouseX = e.pageX - canvasLeft;
		mouseY = e.pageY - canvasTop;
	}
	//画笔功能，绘制路径。
	var drawline = function(){
		ctx.globalCompositeOperation = 'source-over';//默认行为。
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(mx,my);
		ctx.lineTo(mouseX,mouseY);
		ctx.closePath();
		ctx.stroke();
		mx = mouseX;
		my = mouseY;
	}
	//橡皮擦功能。以圆为路径擦除。
	var erasering = function(){
		ctx.globalCompositeOperation = 'destination-out';//说明如何在画布上组合颜色，destination-out表示已有内容不被重叠的部分保留，其他内容透明。
		ctx.save();
		ctx.beginPath();
		ctx.arc(mouseX,mouseY,10,0,2*Math.PI);
		ctx.fill();
		ctx.restore();
	}
	canvasObj.onmousedown = function(e){
		if(drawer)		
			isDraw = true;		//非当前作画者不能作画
		coordinate(e);
		mx = mouseX;
		my = mouseY;
		socket.send({'mx':mx,'my':my});
	}
	canvasObj.onmousemove = function(e){
		coordinate(e);
		
		if(isDraw){
			if(type == 'pencil'){
				drawline();
				socket.send({				//将数据发送到服务端。
					'mouseX':mouseX,
					'mouseY':mouseY,
					'linewidth':ctx.lineWidth,
					'color':ctx.strokeStyle,
					'type':type
				});
			} else if(type == 'eraser'){
				erasering();
				socket.send({
					'mouseX':mouseX,
					'mouseY':mouseY,
					'type':type
				});
			} 

		} 
	}
	canvasObj.onmouseup = function(e){
		isDraw = false;
	}
}

$(document).ready(function(){
	gameroom = true;
	$('.cover').height($('.container').height());
	var mycanvas = document.getElementById('mycanvas');
	
	var owner = document.cookie;
	owner = owner.split('=')[1];
	var myDraw = new Draw(mycanvas);
	myDraw.setlineWidth(2);
	
	if(owner == 'true'){
		myDraw.setDrawer(true);
		drawer = true;
	} else {
		myDraw.setDrawer(false);
	}
	//选择工具
	$(".tool li").each(function(i){
		$(this).click(function(){
			switch(i){
				case 0:
					myDraw.settype('pencil');
					break;
				case 1:
					myDraw.settype("eraser");
					break;
				case 2:
					myDraw.emptyCanvas();
					socket.send({'type':'empty'});
					break;

			}
		});
	});
	//选择画笔大小
	$(".pencil li").each(function(i){
		$(this).click(function(){
			switch(i){
				case 0:
					myDraw.setlineWidth(2);
					break;
				case 1:
					myDraw.setlineWidth(4);
					break;
				case 2:
					myDraw.setlineWidth(6);
					break;
				case 3:
					myDraw.setlineWidth(10);

			}
		});
	});
	//选择颜色
	$(".color li").each(function(i){
		$(this).click(function(){
			switch(i){
				case 0:
					myDraw.setcolor("#000000");break;			
				case 1:
					myDraw.setcolor("#909090");break;				
				case 2:
					myDraw.setcolor("#f0f0f0");break;				
				case 3:
					myDraw.setcolor("#dc0d11");break;
				case 4:
					myDraw.setcolor("#f7921d");break;
				case 5:
					myDraw.setcolor("#f0ee00");break;
				case 6:
					myDraw.setcolor("#35cc05");break;
				case 7:
					myDraw.setcolor("#1aa7e4");break;
				case 8:
					myDraw.setcolor("#0000ff");break;
				case 9:
					myDraw.setcolor("#fe80d2");break;
				case 10:
					myDraw.setcolor("#652c90");break;
				case 11:
					myDraw.setcolor("#daac84");break;
				case 12:
					myDraw.setcolor("#5f3713");break;
				case 13:
					myDraw.setcolor("#b0cc00");break;
			}
		});
	});
	//用户接受聊天消息广播
	var chat_ul = $('.world_chat .chat_area .chat ul'),
		drawarea = $('.drawarea'),
		poptip = $('.poptip'),
		integral = [];
	/*保存用户积分和礼物数目*/
	function holdScore(name,score,flower,egg,slipper,headimg){
		if(!integral.length){
			integral.push({name:name,score:score,flower:flower,egg:egg,slipper:slipper,headimg:headimg});
		} else {
			var i;
			for(i = 0;i < integral.length ;i++){
				if(integral[i].name == name){
					integral[i].score = score;
					integral[i].flower += flower;
					integral[i].egg += egg;
					integral[i].slipper += slipper;
					return false;
				}
			}
			if (i == integral.length){
				integral.push({name:name,score:score,flower:flower,egg:egg,slipper:slipper,headimg:headimg});
			}
		}
	}
	function addScore(obj,score,flower,egg,slipper){
		obj.find('b').text('+'+score).show().hide(3000);
		score = parseInt(obj.children('p.score').text()) + score;
		obj.children('p.score').text(score);
		obj.find('.per_info .score span').text(score);
		var name = obj.attr('_name'),
			headimg = obj.children('img').attr('src');
		holdScore(name,score,flower,egg,slipper,headimg);
		console.log(integral);
	}
	socket.on('receiveInRoom',function(data){
		
		if(data.correct){
			chat_ul.append('<li class="correct"><span>'+data.name+'</span>回答正确！</li>');
			if((drawarea.find('.riddler ul li.correct').length) == (drawarea.find('.riddler ul li').length-2)){
				drawarea.find('.top .countdown').text('1');
			}
			var li_current = drawarea.find('.riddler ul li.current');
			if(!drawarea.find('.riddler ul li.correct').length){								
				addScore(li_current,3,0,0,0);
				if(parseInt(drawarea.find('.top .countdown').text()) > 25){
					chat_ul.append('<li>有人回答正确。游戏将在25S内结束。</li>');
					drawarea.find('.top .countdown').text('25');
				}
				drawarea.find('.riddler ul li').each(function(){
					if($(this).attr('_name') == data.name){
						$(this).addClass('correct');
						$(this).find('b').text('+1').show().hide(3000);				
						addScore($(this),2,0,0,0);
						
					}
				});
			} else {				
				addScore(li_current,1,0,0,0);
				drawarea.find('.riddler ul li').each(function(){
					if($(this).attr('_name') == data.name){
						$(this).addClass('correct');
						$(this).find('b').text('+1').show().hide(3000);				
						addScore($(this),1,0,0,0);
						
					}
				});
			}
			

		} else {
			chat_ul.append(template('chat_list',data));
		}
	});
	var count = setInterval(function(){
		$('.count').hide().fadeTo(50).show();
		var time = $('.count').text();
		time = parseInt(time);
		time -- ;
		$('.count').text(time);
		if(time <= 0){
			chat_ul.append('<li>********回合开始********</li>');
			clearInterval(count);
			$('.count').hide();
			$('.cover').hide();
		}
	},1000);
	//作画者放弃作画
	drawarea.find('.top .painting .quit').click(function(){
		show_answer();
	});
	//倒计时逻辑
	draw_time();
	function ans_time(){
		var ans_time = setInterval(function(){
			var answer = poptip.find('.answer div span');
			var time = answer.text();
			time = parseInt(time);
			time--;
			answer.text(time);
			if(time <= 0){
				clearInterval(ans_time);
				poptip.hide();
				var li_current = drawarea.find('ul li.current');
				drawarea.find('ul li').removeClass('correct');
				if(li_current.next().length){
					var drawer_name = li_current.next().addClass('current').children('h4').text();
					li_current.removeClass('current');
					drawarea.find('.top img').attr('src',li_current.next().children('img').attr('src'));
					drawarea.find('.top .countdown').text('60');
					answer.text('5');
					if(drawer){
						drawer = false;
						myDraw.setDrawer(false);
						drawarea.find('.top .painting').before('<div class="guessing">现在由<span>'+drawer_name+'</span>作画</div>').remove();
						drawarea.find('.painter').hide();
					} else {
						if(drawer_name == name){
							var new_current = drawarea.find('ul li.current');
							$.ajax({
								url:'/room/getWord',
								type:'GET',
								data:{roomid:roomid},
								success:function(data){
									drawarea.find('.top .guessing').before('<div class="painting"><p>题目：<span>'+data.word+'</span></p><a>放弃</a></div>').remove();
									drawer = true;
									myDraw.setDrawer(true);
									drawarea.find('.painter').show();
								},
								error:function(data){
									alert(data);
								}
							});
							
						} else {
							drawarea.find('.top .guessing').html('<div class="guessing">现在由<span>'+drawer_name+'</span>作画</div>');
						}
					}
					draw_time();
					chat_ul.append('<li>********回合开始********</li>');
				} else {
					poptip.show().find('.answer').hide();
					var length = integral.length;
					for(var i = 0;i < length-1;i ++){
						for(var j = length-1;j > i;j --){							
							if(integral[j].score > integral[j-1].score){
								var temp = integral[j];
									integral[j] = integral[j-1];
									integral[j-1] = temp;
							}
						}
					}					
					$('.poptip .rank ul').html(template('rank_list',{list:integral}));
					poptip.find('.rank').show().find('ul').show();
					//一局游戏结束，回到等待房间。
					var rank_countdown = setInterval(function(){
						var times = parseInt($('.poptip .rank .rank_countdown span').text());
						times --;
						$('.poptip .rank .rank_countdown span').text(times);
						if(times <= 0){
							console.log(111111);
							window.location.href = '/room/waitroom?roomid='+roomid;
							clearInterval(rank_countdown);
						}
					},1000);
				}
			}
		},1000);
	}

	function draw_time(){
		var countdown = setInterval(function(){
			var time = $('.top .countdown').text();
			time = parseInt(time);
			time--;
			$('.top .countdown').text(time);
			if(!drawer){
				if (time == 50) {
					$.ajax({
						url:'getTip',
						type:'GET',
						data:{roomid:roomid,times:1},
						success:function(data){
							drawarea.find('.top .guessing').html('提示:'+'<span>'+data.tip+'</span>');	
						}
					});
						
				}
				if (time == 40) {
					$.ajax({
						url:'getTip',
						type:'GET',
						data:{roomid:roomid,times:2},
						success:function(data){
							drawarea.find('.top .guessing span').text(drawarea.find('.top .guessing span').text()+','+data.tip);	
						}
					});
						
				}
			}
			if(time <= 0){
				clearInterval(countdown);
				if(drawer){
					show_answer();
				}
				chat_ul.append('<li>--------回合结束--------</li>');
			}
		},1000);
	}
	function show_answer(){
		poptip.show().find('ul').hide();
		var answer = $('.top .painting span').text();
		var correct_num = drawarea.find('.riddler ul li.correct').length;
		poptip.find('.answer p span').text('【'+answer+'】');
		poptip.find('h5').text(correct_num+'人猜对');
		socket.emit('answer',{roomid:roomid,answer:answer,correct:correct_num});
		ans_time();
	}
	socket.on('getAnswer',function(data){
		console.log(data);
		poptip.show().find('ul').show();
		poptip.find('.answer p span').text('【'+data.answer+'】');
		poptip.find('h5').text(data.correct+'人猜对');
		ans_time();
	});
	//每轮游戏结束，用户送花送鸡蛋等
	poptip.find('.answer ul li').click(function(i){
		if(!$(this).siblings('li').hasClass('click')){
			var index = $(this).index(),
				type = ['鸡蛋','鲜花','拖鞋'];
			$(this).addClass('click');
			socket.emit('sendGift',{roomid:roomid,name:name,type:type[index]});
		}
	});
	socket.on('getGiftMess',function(data){
		console.log(data);
		chat_ul.append('<li><span>'+data.name+'</span>送出'+data.type+'</li>');
		var li_current = drawarea.find('.riddler ul li.current'),
			name = li_current.attr('_name'),
			score = parseInt(li_current.children('.score').text()),
			headimg = li_current.children('img').attr('src');
			flower=0,egg=0,slipper=0;
		switch(data.type){
			case '鲜花' :
				score = 2;
				flower = 1;
				break;
			case '鸡蛋' :
				score = 0;
				egg = 1;
				break;
			case '拖鞋' :
				score = -2;
				slipper = 1;
				break;
			default:
				break;
		}
		addScore(li_current,score,flower,egg,slipper);
		console.log(integral);
	});
	
});