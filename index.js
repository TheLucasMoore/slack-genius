var express = require('express');
var app = express();
var url = require('url');
var request = require('request');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', (process.env.PORT || 9001));

app.get('/', function(req, res){
  res.send('It Works!')
});

app.post('/spotify', function(req, res){
  var artist = req.body.text.replace(" ", "+")
  var url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist + '&api_key=' + process.env.LAST_FM + '&format=json'
  var spotifyUrl = "https://api.spotify.com/v1/search?q=" + artist "&type=artist"

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      var bio = data.artist.bio.summary.split("<a");
      
      // request(spotifyUrl, function (error, response, body) {
      //   var spotData = JSON.parse(body);
      //   var spotlink = spotData.artists.items[0].external_urls.spotify
      // })
    
      var body = {
      response_type: "in_channel",
      text: bio[0],
      attachments: [
          {
          text: "spotlink"
          }
        ]
      };

      res.send("body")
    }
    else {
      var body = {
        response_type: "in_channel",
        text: "There was an error!"
      };
      res.send(body)
    }
  })
});

app.post('/post', function(req, res){
  var parsed_url = url.format({
    pathname: 'https://api.genius.com/search',
    query: {
      access_token: process.env.GENIUS_ACCESS,
      q: req.body.text
    }
  });

  request(parsed_url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      var first_url = data.response.hits[0].result.url;

      var body = {
        response_type: "in_channel",
        text: first_url
      };

      res.send(body);
    }
    else {
      var body = {
        response_type: "in_channel",
        text: "There was an error! " + error
      };
      res.send(body)
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
