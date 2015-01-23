var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/drawguess');//；连接数据库
db.connection.on("error",function(error){
	console.log("数据库连接失败："+error);
});
db.connection.on("open",function(){
	console.log("数据库连接成功！");
});
var Schema = mongoose.Schema; // 创建属性模型,但是此模式还未和users集合有关联
var userScheMa = new Schema({//new Schema()中传入一个JSON对象，该对象形如 xxx:yyyy ,xxx是一个字符串，定义了属性，yyy是一个Schema.Type，定义了属性类型
	name: String,
	sid: String,
	school:String
}); 
exports.user = db.model('users', userScheMa); // 与users集合关联