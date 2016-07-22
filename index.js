var express = require('express');
var app = express();
var url = require('url');
var request = require('request');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', (process.env.PORT || 9001));

app.use('/', express.static('www'));

app.post('/spotify', function(req, res){
  var artist = req.body.text.replace(" ", "+")
  var url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist + '&api_key=' + process.env.LAST_FM + '&format=json'
  var spotifyUrl = "https://api.spotify.com/v1/search?q=" + artist + "&type=artist"

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200 && body !== null) {
      var data = JSON.parse(body);
      var bio = data.artist.bio.summary.split("<a");
      
      request(spotifyUrl, function (error, response, body) {
        var spotData = JSON.parse(body);
        var spotlink = spotData.artists.items[0].external_urls.spotify
    
      var body = {
      response_type: "in_channel",
      text: bio[0] + spotlink,
      };
      res.send(body)
      })
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

app.post('/genius', function(req, res){
  var parsed_url = url.format({
    pathname: 'https://api.genius.com/search',
    query: {
      access_token: process.env.GENIUS_ACCESS,
      q: req.body.text
    }
  });

  request(parsed_url, function (error, response, body) {
    if (!error && response.statusCode == 200 && body !== null && response !== null) {
      var data = JSON.parse(body);
      var song_url = data.response.hits[0].result.url;
      var song_title = data.response.hits[0].result.full_title
      var song_image = data.response.hits[0].result.header_image_thumbnail_url;

      var body = {
        "response_type": "in_channel",
        "attachments": [
        {
          "title": song_title,
          "title_link": song_url,
          "image_url": song_image
        }
        ]
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

app.post('/concert', function(req, res){
  var concertArtist = req.body.text.replace(" ", "+")
  var url = 'http://api.songkick.com/api/3.0/events.json?apikey=' + process.env.SONGKICK_API + '&artist_name=' + concertArtist + 'location=clientip'

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200 && body !== null) {
      var data = JSON.parse(body);
      var results = data.resultsPage.results
      var body;

      if (results.length > 0) {
        var eventType = results.event[0].type
        var displayName = results.event[0].displayName
        var uri = results.event[0].uri

        body = {
        "response_type": "in_channel",
        "attachments": [
        {
          "title": displayName,
          "title_link": uri
          }]
        };
      } else {
        body = {
        response_type: "in_channel",
        text: "It doesn't seem like " + req.body.text + "is coming to your city anytime soon..."
        };
      }

      res.send(body)
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
