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

// Receive messages from the user and respond
var bot = new builder.UniversalBot(connector, function (session) {

  // check for cards that are not asking for pricing
  var re = /(?:^|[^$])\[\[(.*?)\]\]/g;
  var cardName;
  var text = session.message.text;
  session.send("text is " + text);
  while (cardName = re.exec(text)){
    session.send("cardName is " + cardName);
    formattedCardName = cardName[1].replace(/\s/g, "").replace(/'/g, "");
    session.send("formattedCardName is " + formattedCardName);
    session.send("request is " + "https://api.scryfall.com/cards/search?q=!" + formattedCardName + "+not:online")
    request("https://api.scryfall.com/cards/search?q=!" + formattedCardName + "+not:online", function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          if (info.data[0].hasOwnProperty('image_uri')){
            session.send(info.data[0].image_uri);
          }
          else{
            session.send("No image URL found for " + info.data[0].name + ".");
          }
        }
        else{
          session.send("Unable to find card.");
        }
    })
  }

  // check for cards asking for pricing
  var re_price_check = /\$\[\[(.*?)\]\]/g;
  while (cardName = re_price_check.exec(text)){
    formattedCardName = cardName[1].replace(/\s/g, "").replace(/'/g, "");
    request("https://api.scryfall.com/cards/search?q=!" + formattedCardName + "+not:online", function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          if (info.data[0].hasOwnProperty('image_uri')){
            session.send(info.data[0].image_uri);
          }
          else{
            session.send("No image URL found for " + info.data[0].name + ".");
          }
          if (info.data[0].hasOwnProperty('usd')){
            session.send(info.data[0].name + " is about $" + info.data[0].usd + ".")
          }
        }
        else{
          session.send("Unable to find card.");
        }
    })
  }
});
