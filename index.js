var fs = require('fs');
var express = require("express");
var log = require('fancy-log');
var alexa = require("alexa-app");
var verifier = require('alexa-verifier-middleware');
var bodyParser = require("body-parser");
var path = require('path');
var config = require('./config');
var words = require('./words');
var _ = require('underscore');
var prototype = require('prototype');
var mysql = require('mysql');

var app = express();
var PORT = process.env.port || 8085;

var connection = mysql.createConnection({
  host     : config.mysqlHost,
  user     : config.mysqlUser,
  password : config.mysqlPassword,
  database : config.mysqlDB
});

//app.use(verifier);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'static')));

var alexaApp = new alexa.app("wortspiel");

var absHighscore = fs.readFileSync('highscore', 'utf8');

alexaApp.launch(function(request, response) {
  log.info('Spiel gestartet für User '+request.getSession().details.userId);
  //var persHighscore = null;
  getPersHighscore(request.getSession().details.userId, function(err,data){
    if (err) {
      // error handling code goes here
      log.error(err);            
    } else {            
      // code to execute on data retrieval
      log.info("result from db is : ",data);
      if (typeof data == 'undefined') {
   	    var persHighscore = 0;
   	    var post  = {user_id: request.getSession().details.userId, score: persHighscore};
   	    var query = connection.query('INSERT INTO highscores SET ?', post, function (error, results, fields) {
   	      if (error) log.error(error);
   	      // Neat!
   	    });
   	  } else {
   		var persHighscore = data.score;
   	  }
   	  var alphabet = range('a','z');
   	  var randomLetter = words[alphabet[random(0,25)]];
   	  var word = randomLetter[random(0,randomLetter.length-1)];
   	  response.say("Das Wortspiel.");
   	  response.say("Dein persönlicher Highscore liegt bei "+persHighscore+" Punkten.");
   	  response.say("Spreche bitte langsam und deutlich. Ich fang an. Mein Wort lautet: <break time=\"1s\" /> ");
   	  response.say(" "+word+" ");
   	  response.reprompt("Bitte sage jetzt ein Wort das mit dem letzten Buchstaben des folgenden Wortes beginnt: <break time=\"1s\" /> "+word);
      var session = request.getSession();
   	  session.set("score", 0);
   	  session.set("persHighscore", persHighscore);
   	  session.set("alexaword", word);
   	  session.set("userWords", "start");
   	  response.shouldEndSession(false);
   	  response.send();
    }    

  });
  return false;
});

alexaApp.intent("AMAZON.HelpIntent", 
  function(request, response) {
    var session = request.getSession();
    var alexaWord = session.get("alexaword");
    response.say("Die Spielregeln. Wir sagen immer abwechselnd Worte, die mit dem letzten Buchstaben des vorigen Wortes beginnen. Du darfst kein Wort zweimal verwenden. ");
    response.say("Das Spiel läuft so lange, bis du entweder kein Wort oder ein falsches Wort sagst. ");
    response.say("Für jeden Buchstaben eines deiner Worte erhälst du einen Punkt. Je länger dein Wort, um so besser. Spreche bitte langsam und deutlich, damit ich dich richtig verstehe. ");
    response.say("Am besten funktioniert es, wenn du gebräuchliche Worte der deutschen Sprache verwendest. ");
    if (alexaWord) {
      response.say("Mein Wort lautet: <break time=\"1s\" /> "+alexaWord+" ");
      response.reprompt("Mein Wort ist "+alexaWord+". Wie lautet deins?");
      if(request.sessionDetails.new == false) response.shouldEndSession(false);
    }
    response.send();
    return false;
  }
);

alexaApp.intent("AMAZON.StopIntent", 
  function(request, response) {
    var session = request.getSession();
    var score = session.get("score");
    var persHighscore = session.get("persHighscore");
    if(!score) score = 0;
    if(!persHighscore) persHighscore = 0;
    response.say("OK. Du hast "+score+" Punkte erreicht. Dein persönlicher Highscore liegt aktuell bei "+persHighscore+" Punkten. Der absolute Highscore liegt bei "+absHighscore+" Punkten.");
    response.shouldEndSession(true);
    response.send();
    return false;
  }
);

alexaApp.intent("AMAZON.CancelIntent", 
  function(request, response) {
    var session = request.getSession();
    var score = session.get("score");
    var persHighscore = session.get("persHighscore");
    if(!score) score = 0;
    if(!persHighscore) persHighscore = 0;
    response.say("OK. Du hast "+score+" Punkte erreicht. Dein persönlicher Highscore liegt aktuell bei "+persHighscore+" Punkten. Der absolute Highscore liegt bei "+absHighscore+" Punkten.");
    response.shouldEndSession(true);
    response.send();
    return false;
  }
);

alexaApp.intent("AMAZON.YesIntent", 
  function(request, response) {
    log.info('Erneut Spiel gestartet');
    var session = request.getSession();
    var persHighscore = session.get("persHighscore");
    if(!persHighscore) persHighscore = 0;
    session.clear();
    var alphabet = range('a','z');
    var randomLetter = words[alphabet[random(0,25)]];
    var word = randomLetter[random(0,randomLetter.length-1)];
    response.say("OK. Auf ein Neues.");
    response.say("Mein Wort lautet: <break time=\"1s\" /> "+word+" ");
    response.reprompt("Bitte sage jetzt ein Wort das mit dem letzten Buchstaben des folgenden Wortes beginnt: <break time=\"1s\" /> "+word);
    request.getSession().set("score", 0);
    request.getSession().set("persHighscore", persHighscore);
    request.getSession().set("alexaword", word);
    request.getSession().set("userWords", "start");
    response.shouldEndSession(false);
    response.send();
    return false;
  }
);

alexaApp.intent("AMAZON.NoIntent", 
  function(request, response) {
    var session = request.getSession();
    var persHighscore = session.get("persHighscore");
    if(!persHighscore) persHighscore = 0;
    response.say("Schade. Vielleicht schlägst du deinen persönlichen Highscore von "+persHighscore+" Punkten ja beim nächsten Mal.");
    response.shouldEndSession(true);
    response.send();
    return false;
  }
);

alexaApp.intent("GetWord", 
  function(request, response) {
    var session = request.getSession();
    var alexaWord = session.get("alexaword");
    var userWord = request.slot("Keyword");
    var userWordLastLetter = userWord[userWord.length-1];
    var word = words[userWordLastLetter][random(0,words[userWordLastLetter].length-1)];
    log.info(alexaWord+", "+userWord+": "+userWord.toLowerCase().startsWith(alexaWord.toLowerCase()[alexaWord.length-1])+"("+alexaWord.toLowerCase()[alexaWord.length-1]+")");
    session.set("alexaword", word);
    if(userWord.toLowerCase().startsWith(alexaWord.toLowerCase()[alexaWord.length-1]) && session.get("userWords").indexOf(userWord+",") == -1) {
      response.say(" "+word+" ");
      response.reprompt("Mein Wort ist "+word+". Wie lautet deins?");
      //response.card({
        //type: "Simple",
        //title: "Das Wortspiel",
        //content: "http://www.t-online.de: "+word
      //});
      session.set("score", session.get("score") + request.slot("Keyword").length);
      session.set("userWords", session.get("userWords")+","+userWord);
    } else if(session.get("userWords").indexOf(userWord+",") >= 0) {
      response.say("Leider hast du das Wort "+userWord.toUpperCase()+" schon einmal benutzt. Du hast "+session.get("score")+" Punkte erreicht.");
      if(session.get("score") > absHighscore) {
        response.say("Herzlichen Glückwunsch, du hast den bisherigen absoluten Highscore von "+absHighscore+" Punkten geschlagen.");
        absHighscore = session.get("score");
        fs.writeFile("highscore", absHighscore, function(err) {
          if(err) {
            return log.error(err);
          }
          log.info("Neuer Highscore: "+absHighscore);
        });
        persHighscore = session.get("score");
        session.set("persHighscore", persHighscore);
        var post  = [{score: persHighscore}, request.getSession().details.userId];
        var query = connection.query('UPDATE highscores SET ? WHERE user_id = ?', post, function (error, results, fields) {
          if (error) log.error(error);
          // Neat!
        });
      } else if (session.get("score") > session.get("persHighscore")) {
        persHighscore = session.get("score");
        session.set("persHighscore", persHighscore);
        var post  = [{score: persHighscore}, request.getSession().details.userId];
        var query = connection.query('UPDATE highscores SET ? WHERE user_id = ?', post, function (error, results, fields) {
          if (error) log.error(error);
          // Neat!
        });
        response.say("Herzlichen Glückwunsch, du hast einen neuen persönlichen Highscore erreicht.");
      }
      response.say("Möchtest du noch einmal spielen?").shouldEndSession(false);
    } else {
      response.say("Leider fängt das Wort "+userWord.toUpperCase()+" nicht mit einem "+alexaWord[alexaWord.length-1].toUpperCase()+" an. Du hast "+session.get("score")+" Punkte erreicht.");
      if(session.get("score") > absHighscore) {
        response.say("Herzlichen Glückwunsch, du hast den bisherigen absoluten Highscore von "+absHighscore+" Punkten geschlagen.");
        absHighscore = session.get("score");
        fs.writeFile("highscore", absHighscore, function(err) {
          if(err) {
            return log.error(err);
          }
          log.info("Neuer Highscore: "+absHighscore);
        });
        persHighscore = session.get("score");
        session.set("persHighscore", persHighscore);
        var post  = [{score: persHighscore}, request.getSession().details.userId];
        var query = connection.query('UPDATE highscores SET ? WHERE user_id = ?', post, function (error, results, fields) {
          if (error) log.error(error);
          // Neat!
        });
      } else if (session.get("score") > session.get("persHighscore")) {
          persHighscore = session.get("score");
          session.set("persHighscore", persHighscore);
          var post  = [{score: persHighscore}, request.getSession().details.userId];
          var query = connection.query('UPDATE highscores SET ? WHERE user_id = ?', post, function (error, results, fields) {
            if (error) log.error(error);
            // Neat!
          });
          response.say("Herzlichen Glückwunsch, du hast einen neuen persönlichen Highscore erreicht.");
      }
      response.say("Möchtest du noch einmal spielen?").shouldEndSession(false);
    }
    if(request.sessionDetails.new == false) response.shouldEndSession(false);
    response.send();
    return false;
  }
);

alexaApp.error = function(exception, request, response) {
  log.error(exception);
  response.say("Sorry, das habe ich nicht richtig verstanden. Sage es bitte nochmal.");
  if(request.sessionDetails.new == false) response.shouldEndSession(false);
  response.send();
  return false;
};

alexaApp.sessionEnded(function(request,response) {
  response.say("OK. bis zum nächsten mal.");
  response.send();
  return false;
});

// launch /echo/test in your browser with a GET request
alexaApp.express(app, "/echo/");

app.listen(PORT);
log.info("Listening on port " + PORT);

function precise_round(num, decimals) {
   var t = Math.pow(10, decimals);   
   return (Math.round((num * t) + (decimals>0?1:0)*(Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals);
}

function random (low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low);
}

function range(start,stop) {
  var result=[];
  for (var idx=start.charCodeAt(0),end=stop.charCodeAt(0); idx <=end; ++idx){
    result.push(String.fromCharCode(idx));
  }
  return result;
}

function getPersHighscore(user_id, callback)
{
  connection.query('SELECT score FROM highscores WHERE user_id = ?', [user_id], function(err, result)
  {
    if (err) 
      callback(err,null);
    else
      callback(null,result[0]);
  });
}
