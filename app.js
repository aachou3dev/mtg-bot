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
  var re = /\[\[(.*?)\]\]/g;
  var cardName;
  var text = session.message.text;
  while (cardName = re.exec(text)){
    formattedCardName = cardName[1].replace(/\s/g, "+").replace(/'/g, "");
    request("https://api.scryfall.com/cards/named?exact=" + formattedCardName + "&format=json", function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          if (info.hasOwnProperty('image_uri')){
            session.send(info.image_uri);
          }
          else{
            session.send("No image URL found card.");
          }
        }
        else{
          session.send("Unable to find card.");
        }
    })
  }
});
