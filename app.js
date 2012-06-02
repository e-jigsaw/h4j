var oauth = new (require("oauth").OAuth)(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    process.env.TWITTER_CONSUMER_KEY,
    process.env.TWITTER_CONSUMER_SECRET,
    "1.0",
    "http://phettwee.herokuapp.com/callback",
    "HMAC-SHA1"
);
var express = require('express');
var twitter = require("twitter");
var mongoose = require("mongoose");
var schema = mongoose.Schema;
var setting = new schema({
    screen_name: String,
    access_token: String,
    access_token_secret: String,
    pref_code: String
});
var model = mongoose.model("settings", setting);

var app = module.exports = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'ineedsecret' }));
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  mongoose.connect(process.env.MONGOHQ_URL);
});

app.dynamicHelpers({
    session: function(req, res) {
        return req.session;
    }
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/', function(req, res){
  res.render('index', {
    layout: false
  });
});

app.get("/user", function(req, res) {
  res.render("user", {
    layout: false
  });
});

app.get("/auth", function(req, res) {
    oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if(error) {
            res.send(error);
        } else {
            req.session.oauth = {};
            req.session.oauth.token = oauth_token;
            req.session.oauth.token_secret = oauth_token_secret;
            res.redirect("https://twitter.com/oauth/authenticate?oauth_token=" + oauth_token);
        }
    });
});

app.get("/callback", function(req, res) {
    if(req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        oauth.getOAuthAccessToken(req.session.oauth.token, req.session.oauth.token_secret, req.session.oauth.verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results) {
                if(error) {
                    res.send(error);
                } else {
                    req.session.oauth.access_token = oauth_access_token;
                    req.session.oauth.access_token_secret = oauth_access_token_secret;
                    req.session.user_profile = results;
                    res.redirect("http://localhost/user");
                }
            }
        );
    }
});

app.listen(process.env.PORT||3000, function() {
  console.log("Listening on port:"+app.address().port);
});

app.get("/search", function(req, res) {
  res.render("search", {
    layout: false
  });
});
