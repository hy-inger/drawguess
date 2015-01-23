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
router.get('/room/painting', function(req, res) {
　　res.render('room/painting');

});



module.exports = router;