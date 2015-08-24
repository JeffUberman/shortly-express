module.exports = function(req, res, next){
  /*
 if(isProtected(req.url) && !req.session.cookie['session_id']){
   res.render('../views/login');
 } else {
   console.log('letting through');
   next();
 }*/
 next();
};

var isProtected = function(path){
  return path != '/login' && path !='/signup';
}




















