#!/usr/bin/env node

var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    http = require('http'),
    events = require('events'),
    async = require('async'),
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


// input : array of disease ids
function getMonarchObjectArray(input, callbackOutside) {

  var monarchObjectArray = [];
  // input : disease id string
  function getMonarchObject(input, callbackOutside) {
    console.log('getMonarchObject input');
    console.log(input);
    
    var sub_String = input.substring(0,4);
    var path = '';
    
    if(sub_String.toLowerCase() == 'omim') {
      path = '/disease/' + input + '.json';
    } else {
      path = '/gene/' + input + '.json';
    }

    var options = {
      host: 'www.monarchinitiative.org',
      path: path,
      port: '80',
      headers: {'accept': 'application/json'}
    };
    callback = function(response) {
      var str = '';
      response.on('data', function (chunk) {
        str += chunk;
      });
      response.on('end', function (data) {
        console.log('data');
        console.log(str);

        monarchObjectArray.push(str);
        callbackOutside(str);
      });
    };

    var req = http.request(options, callback);
    req.end();
  }

  console.log('getMonarchObjectArray input');
  console.log(input);
  async.eachSeries(input, getMonarchObject, function(monarchObject) {
  });
}


//input : geneid
//output is array of json docs
function getESObject(input, callback) {

}

// Elasticsearch client
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});


app.get('/query/', function(req, res) {
  var input = ['OMIM_127750', 'OMIM_105830'];
  getMonarchObjectArray(input, function(disease) {
    res.json(disease);
  });
});

var server = app.listen(3333, function() {
  console.log("Listening to the port %d", server.address().port);
});
