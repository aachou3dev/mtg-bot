var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {

    request('https://api.magicthegathering.io/v1/cards?name="' + session.message.text + '"', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          var foundUrl = false
          if (info.cards.length > 0) {
              for (var i=0; i < info.cards.length; i++){
                  if (info.cards[i].hasOwnProperty('imageUrl')){
                    session.send(info.cards[i].imageUrl);
                    foundUrl = true
                    break;
                  }
              }
              if (!foundUrl){
                session.send("No image URL found for this card.")
              }
          }
          else{
              session.send("Unable to find card.")
          }
        }
        else{
          session.send("There is currently an issue with the API.  Please try again later.")
        }
    })
});
