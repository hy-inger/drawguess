$(document).ready(function(){
	var mycanvas = document.getElementById('mycanvas');
	var mycontext = mycanvas.getContext('2d');
	mycontext.lineJoin.lineCap = "round";//线条末端样式
	mycontext.shadowColor = 10;
	mycontext.shadowColor = 'rgb(0, 0, 0)';
	var isDraw;
	mycanvas.onmousedown = function(e){
		console.log(e.clientX-parseInt($(".container").css("margin-left")));
		isDraw = true;
		mycontext.moveTo(e.clientX-parseInt($(".container").css("margin-left")),e.clientY);
	}
	mycanvas.onmousemove = function(e){
		if(isDraw) {
			mycontext.lineTo(e.clientX-parseInt($(".container").css("margin-left")),e.clientY);
			mycontext.stroke();
		}
	}
	mycanvas.onmouseup = function(){
		isDraw = false;
	}

	$(".pencil li").each(function(i){
		$(this).click(function(){
			switch(i){
				case 0:
					mycontext.lineWidth = 3;
					break;
				case 1:
					mycontext.lineWidth = 4;
					break;
				case 2:
					mycontext.lineWidth =6;
					break;

			}
			console.log(mycontext.lineWidth);
		});
	});
});