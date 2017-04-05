var express = require('express');
var app = express();
var url = require('url');
var request = require('request');
var path = require('path');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('port', (process.env.PORT || 9001));

// ###### START ALL THE ROUTES ####### \\

app.use('/', express.static('www'));

// Oauth Flow and redirection
app.get('/slacked', function(req, res) {
  var code = req.param('code');
  var data = {
    form: {
      client_id: process.env.SLACK_CLIENT,
      client_secret: process.env.SLACK_SECRET,
      code: code
    }
  }
  request.post('https://slack.com/api/oauth.access', data, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      res.redirect('/success');
    }
  })
})

app.get('/success', function(req, res) {
  res.sendFile('success.html', {
    root: path.join(__dirname, '/www')
  });
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
