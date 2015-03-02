function Draw(canvasObj){
	var mouseX,mouseY,mx,my;
	var isDraw = false;
	var ctx = canvasObj.getContext('2d');
	var type = "pencil";
	var begin = {};
	socket = io.connect('ws://localhost',{
 		transports: ['websocket'],
 		"try multiple transports": false,
 		reconnect: true
 	});
	socket.on('open',function(){
	  console.log('连接成功');
	});
	socket.on('message',function(json){
	  console.log(json);
	});
	socket.emit("my event","huangying connect!");
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
		isDraw = true;	
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
	var mycanvas = document.getElementById('mycanvas');
	var mycontext = mycanvas.getContext('2d');
	var myDraw = new Draw(mycanvas);
	myDraw.setlineWidth(2);
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
	
	
});