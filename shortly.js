var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSessions = require('express-session');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

//Require for Sessions
app.use(cookieParser());
app.use(expressSessions({"secret": "am i secure?"
}));



//set salt
var salt = bcrypt.genSaltSync(10);


//set up checkLogin middleware
var checkLogin = require('./helpers/checkLogin.js');
app.use(checkLogin);


app.get('/',
function(req, res) {
  res.render('index');
});


app.get('/create',
function(req, res) {
  res.render('index');
});

app.get('/links',
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup', function(req, res){
  console.log('rendering signup');
  res.render('signup');
});


app.post('/signup', function(req, res){

    var newUser = req.body;

    new User( {user_name: newUser.username, password: newUser.password }).fetch().then(function(found){
      if(found){
        res.send(200, found.attributes)
      } else {
        var hash = bcrypt.hashSync(newUser.password, salt);

        var user = new User({ user_name: newUser.username, password: hash});
        user.save().then(function(newUser){
          console.log(newUser);
          Users.add(newUser);
          res.send(200, newUser);
        })
      }
    });
    res.render('index');
});

app.get('/login', function(req, res){
  console.log('rendering login');
  res.render('login');
});

app.post('/login', function(req, res){
    var loginUser = req.body;
    var hash = bcrypt.hashSync(loginUser.password, salt);
    new User( {user_name: loginUser.username, password: hash }).fetch().then(function(found){
      if(found){
        console.log("In login", found.attributes);
        res.send(200);
      }  else {
        console.log("in login", "ain't found shit");
        res.send(200);
      }
    });

    res.render('index');
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
