var express = require('express');
var app = express();
var url = require('url');
var request = require('request');
var path = require('path');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', (process.env.PORT || 9001));

// set one variable for error handling with slack requests
var errorBody = { // in the club gettin' tipsy. </50centlyrics>
  response_type: "in_channel",
  text: "There was an error! Check your spelling?"
};

// ###### START ALL THE ROUTES ####### \\

app.use('/', express.static('www'));

// Oauth Flow and redirection
app.get('/slacked', function(req, res){
  var code = req.param('code');
  var data = {
    form: {
      client_id: process.env.SLACK_CLIENT,
      client_secret: process.env.SLACK_SECRET,
      code: code
    }
  }
  request.post('https://slack.com/api/oauth.access', data, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.redirect('/');
    }
  })
})

app.get('/success', function(req, res){
  res.sendFile('success.html', { root: path.join(__dirname, '../www') });
})

app.post('/artist', function(req, res){
  if (req.body.token !== process.env.SLACK_STATE) {
    res.send("This request isn't coming from Slack! Install the app plz.")
  } else {
  var artist = req.body.text.replace(" ", "+")
  var url = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + artist + '&api_key=' + process.env.LAST_FM + '&format=json'
  var spotifyUrl = "https://api.spotify.com/v1/search?q=" + artist + "&type=artist"

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200 && body !== null) {
      var data = JSON.parse(body);
      var bio = data.artist.bio.summary.split("<a");
      
      request(spotifyUrl, function (error, response, body) {
        var spotData = JSON.parse(body);
        if (spotData.artists.items.length == 0) {
          res.send(errorBody)
        } else {
        var spotlink = spotData.artists.items[0].external_urls.spotify
    
      var body = {
      response_type: "in_channel",
      text: bio[0] + "... " + spotlink,
      };
      res.send(body)
        } // else
      })
    }
    else {
      res.send(errorBody)
    }
  })
  }
});

app.post('/album', function(req, res){
  var album = req.body.text.replace(" ", "+")
  var url = 'https://api.spotify.com/v1/search?q=' + album + '&type=album'

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200 && body !== null) {
      var data = JSON.parse(body);
      var body;

      if (data.albums.items.length > 0) {
        var albumName = data.albums.items[0].name
        var albumLink = data.albums.items[0].external_urls.spotify
        var albumArt = data.albums.items[0].images[0].url
        body = {
          "response_type": "in_channel",
          "text": albumLink,
          "attachments": [
          {
            "title": albumName,
            "image_url": albumArt
          }]
          };
          res.send(body);
        } else {
          res.send(errorBody);
        }
    } else {
      res.send(errorBody);
    }
  });
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

      if (data.response.hits.length > 0) {
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
    }
    else {
      res.send(errorBody)
    }
  });
});

app.post('/concert', function(req, res){
  var text = req.body.text.split(",")
  var location = text[0];
  var artist = text[1];
  var concertArtist = artist.replace(" ", "+")

  var locationUrl = 'https://api.songkick.com/api/3.0/search/locations.json?query=' + location + '&apikey=' + process.env.SONGKICK_API

  request(locationUrl, function (error, response, body) {
    var locationData = JSON.parse(body);
    var locationId = locationData.resultsPage.results.location[0].metroArea.id
    var url = 'https://api.songkick.com/api/3.0/events.json?apikey=' + process.env.SONGKICK_API + '&artist_name=' + concertArtist + '&location=sk:' + locationId

    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200 && body !== null) {
        var data = JSON.parse(body);
        var results = data.resultsPage.results;
        var size = data.resultsPage.totalEntries;
        var body;

        if (size !== 0) {
          var eventType = results.event[0].type
          var displayName = results.event[0].displayName
          var uri = results.event[0].uri

          body = {
          "response_type": "in_channel",
          "text": "I found a " + eventType,
          "attachments": [
          {
            "title": displayName,
            "title_link": uri
            }]
          };
        } else {
          body = {
          response_type: "in_channel",
          text: "It doesn't seem like" + artist + " will be in " + location + " anytime soon."
          };
        }
        res.send(body)
      }
    })
  })
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});