var express = require('express');
var router = express.Router();
var User = require('../database/db').user;

/* GET home page. */
router.get('/', function(req, res) {
	User.find(function(err,docs){//查询数据库的数据
		res.render('index', { title: 'index' ,user:docs});
	});
　　
});

/*add*/
router.get('/add', function(req, res) {
　　res.render('add', { title: 'add' });

});
router.post('/add', function(req, res) {
	var  user = new User({
		sid : req.body.sid,
		name : req.body.name,
		school : req.body.school
	});
	user.save(function(err,docs){//保存数据到数据库后执行回调函数
		res.redirect('/');
	});
});

/*delete*/
router.get('/del',function(req,res){
	var id = req.query.id;//获取url带的参数
	console.log('-----------------------id=' + id);

	if(id && ''!=id){
		User.remove({"_id":id},function(err,docs){//删除数据成功后执行回调函数
			res.send({"data":true});//发送object数据到前端
		});
	}
});
/*modify*/
router.get('/modify', function(req, res) {
	var id = req.query.id;
	console.log("-------------id="+id);
	if(id && '' != id){
		User.find({"_id":id},function(err,docs){//从数据库中查找_id为id的数据。
			res.render('modify', { title: 'modify' ,user:docs[0]});
		});
	}
});
router.post('/modify',function(req,res){
	var newdata = {
		sid : req.body.sid,
		name : req.body.name,
		school : req.body.school
	};
	var id = req.body.id;
	if(id && '' != id){
		User.update({"_id":id},newdata,function(err,docs){//更新数据库中的数据
			console.log("----------------------update:"+docs);
			res.redirect('/');
		});
	}
});

module.exports = router;