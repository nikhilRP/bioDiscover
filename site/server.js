#!/usr/bin/env node

var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    http = require('http'),
    events = require('events'),
    elasticsearch = require('elasticsearch'),
    express = require('express');

var app = express();
//var engine = new bbop.monarch.Engine();

function escapeHtml(value) {
  return value.toString().
    replace('<', '&lt;').
    replace('>', '&gt;').
    replace('"', '&quot;');
}

function getPathway(input, callbackOutside) {
  var options = {
    host: 'www.monarchinitiative.org',
    path: '/disease/' + input + '.json',
    port: '80',
    headers: {'accept': 'application/json'}
  };
  callback = function(response) {
    var str = '';
    response.on('data', function (chunk) {
      str += chunk;
    });
    response.on('end', function () {
      callbackOutside('result');
    });
  };

  var req = http.request(options, callback);
  req.end();
}

// Elasticsearch client
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

app.get('/query/', function(req, res) {

  client.ping({
    requestTimeout: 1000,
  }, function (error) {
    if (error) {
      console.error('elasticsearch cluster is down!');
    } else {
      console.log('All is well');
    }
  });
});

app.get('/queryMonarch/', function(req, res) {
  var input = 'OMIM_127750';
  getPathway(input, function(disease) {
    res.json(disease);
    console.log(res);
  });
});

var server = app.listen(3333, function() {
  console.log("Listening to the port %d", server.address().port);
});