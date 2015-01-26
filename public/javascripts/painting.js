function Draw(canvasObj){
	var mouseX,mouseY,mx,my;
	var isDraw = false;
	var ctx = canvasObj.getContext('2d');
	ctx.shadowBlur = 3;
	//ctx.shadowColor = 'rgb(0,0,0)';
	ctx.lineJoin = ctx.lineCap = "round";//线条末端样式
	this.setlineWidth = function(lw){
		ctx.lineWidth = lw;
	}
	this.setcolor = function(sc){		
		ctx.strokeStyle = sc;
		ctx.shadowColor = sc;
	}
	var coordinate = function(e){
		mouseX = e.clientX-parseInt($(".container").css("margin-left"));
		mouseY = e.clientY;

	}
	canvasObj.onmousedown = function(e){		
		isDraw = true;	
		coordinate(e);
		mx = mouseX;
		my = mouseY;
	}
	canvasObj.onmousemove = function(e){
		coordinate(e);
		console.log(ctx.fillStyle);
		if(isDraw){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(mx,my);
			ctx.lineTo(mouseX,mouseY);
			ctx.closePath();
			ctx.stroke();
			mx = mouseX;
			my = mouseY;
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
	myDraw.setlineWidth(4);

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

			}
		});
	});
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