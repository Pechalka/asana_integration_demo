var path = require('path');
var bodyParser = require('body-parser');
var express = require('express');

var config = require('./config.json');

var app = express();

app.use(function nocache(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

// app.use(require('cookie-parser')());
// app.use(require('cookie-session')({
//     secret: 'config.secret'
// }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/test', function(req, res){
    res.json({
        users : 'test'
    })
})

app.use(express.static(path.join(__dirname, 'public')));

var server = require('http').Server(app);
var io = require('socket.io')(server);

// var app = require('express').createServer();
// var io = require('socket.io')(app);


app.listen(5000, function () {
    console.log('http://localhost:' + 5000);
});

io.listen(8000);


var s;

io.on('connection', function (socket) {
  s = socket;
  socket.emit('event', { message : 'Listening to new stories on project 31842998223160' });
});


var asana = require('asana');

// Arguments / constants
var apiKey = config.apiKey;
var projectId = config.projectId;

// Set up a client using basic authentication
var client = asana.Client.create().useBasicAuth(apiKey);

console.log('Listening to new stories on project', projectId);

client.events.stream(projectId, {
    periodSeconds: 3,
    continueOnError: true
  })
  .on('data', function(event) {
    
    console.log('event', event);
    s.emit('event', event);
    console.log('send to socket');

  // Here we filter to just the type of event we care about.
    if (event.type === 'story' && event.action === 'added') {
      // Fetch the story and then process it.
      var storyId = event.resource.id;
      return client.stories.findById(storyId)
        .then(function(story) {
          console.log(
            'New story on task',
            '[' + story.target.name + ']:', story.text);
        })
        .catch(function(error) {
          console.log('Error fetching story', storyId, error);
        });
    }
  })