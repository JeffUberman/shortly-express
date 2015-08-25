module.exports = function(req, res, next){

 if(isProtected(req.url)){
   if(!req.session['user']) //not logged in
     res.redirect('/login');
   else { //is logged in
     next();
   }
 } else { //trying to go to signup or login
   if(req.session['user']) //is logged in
     res.redirect('/index');
   else { //is not logged in
     next();
   }
 }
};

var isProtected = function(path){
  return path != '/login' && path !='/signup';
}




















