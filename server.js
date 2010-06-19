#!/usr/bin/env node

var sys = require("sys");
var url = require("url");
var qs = require("querystring");

var fu = require("./fu");

HOST = null; // localhost
PORT = 8080;
fu.listen(PORT, HOST);

// static files
fu.get("/", fu.staticHandler("typeracer.html"));
fu.get("/img/finish.gif", fu.staticHandler("img/finish.gif"));
fu.get("/img/car1.png", fu.staticHandler("img/car1.png"));
fu.get("/img/car2.png", fu.staticHandler("img/car2.png"));
fu.get("/img/car3.png", fu.staticHandler("img/car3.png"));
fu.get("/img/car4.png", fu.staticHandler("img/car4.png"));
fu.get("/typeracer.css", fu.staticHandler("typeracer.css"));
fu.get("/js/typeracer.js", fu.staticHandler("js/typeracer.js"));
fu.get("/js/jquery-1.4.min.js", fu.staticHandler("js/jquery-1.4.min.js"));
fu.get("/js/jquery.tools.min.js", fu.staticHandler("js/jquery.tools.min.js"));

// functions
var RACES = [];

fu.get("/races", function (req, res) {
  if (RACES.length > 0) {
    var content = 'or join'
  } else {
    var content = '';
  }
  content += '<ul id="races">';
  for (var i=0; i<RACES.length; i++) {
    content += '<li><span id="'+i+'" class="join">Race #' + (i+1) +'</span></li>\n';
  }
  content += '</ul>'

  res.simpleText(200, content);
});

fu.get("/create", function (req, res) {
  var race = RACES.length;
  var nick = 'user1';
  race_info = {}
  race_info[nick] = {}
  RACES.push(race_info);
  var info = {race: race, nick: nick, race_info: race_info};
  res.simpleJSON(200, info);
});

fu.get("/join", function (req, res) {
  var nick = 'user2'; // get this from user
  var race = qs.parse(url.parse(req.url).query).race;
  var race_info = RACES[race];
  race_info[nick] = {}
  sys.puts(JSON.stringify(race_info));
  res.simpleJSON(200, {race: race, nick: nick, race_info: race_info});
});

fu.get("/status", function (req, res) {
  var query = qs.parse(url.parse(req.url).query);
  var race_info = RACES[query.race];
  race_info[query.nick].total = query.total;
  race_info[query.nick].typed = query.typed;
  race_info[query.nick].step = query.step;
  res.simpleJSON(200, race_info);
});
