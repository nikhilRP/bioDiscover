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
  function getMonarchObject(input, callbackEach) {
    var sub_String = input.substring(0,4);
    var path = '';
    
    if(sub_String.toLowerCase() == 'omim') {
      path = '/disease/' + input + '.json';
    } else {
      path = '/gene/' + input + '/references.json';
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
        var monarchObjectJson = JSON.parse(str);
        monarchObjectArray.push(monarchObjectJson);
        callbackEach(monarchObjectJson);
      });
    };

    var req = http.request(options, callback);
    req.end();
  }
  async.eachSeries(input, getMonarchObject, function(monarchObject) {
    callbackOutside(monarchObjectArray);
  });
}


//input : geneid
//output is array of json docs
function getDrugs(input, callback) {

  input = 'ENSG00000133488';
  // querying for drugs
  client.search({
    index: 'app',
    type: 'drugs',
    q: 'genes:' + input
  }, function (error, response) {
    response = response['hits']['hits'];
    callback(response);
  });

}

//input : geneid
function getPathways(input, callback) {

  input = 'ENSMUSG00000021518';
  client.search({
    index: 'app',
    type: 'wikipathways',
    q: 'genes:' + input
  }, function (error, response) {
    response = response['hits']['hits'];
    callback(response);
  });
}

// Elasticsearch client
var client = new elasticsearch.Client({
  host: 'localhost:9200'
});


app.get('/query/', function(req, res) {
  var input = ['OMIM_127750',  'OMIM_105830'];
  var updatedDiseases = [];

  function convertDisease(disease, callbackDiseaseConverter) {
    console.log('disease');
    console.log(disease);
    var gene_associations = disease['gene_associations'];
    disease.genes = [];
    async.each(gene_associations, function(gene_association, callbackGeneAssociation) {
      //console.log('gene_association');
      //console.log(gene_association);
      var geneId = gene_association.gene.id;
      console.log('geneId');
      console.log(geneId);
      disease.genes.push(geneId.replace(':', '_'));
      //disease.genes.push(geneId);
      updatedDiseases.push(disease);
      callbackGeneAssociation(null, disease);
    }, function(err, disease){
      updatedDiseases.push(disease);
      callbackDiseaseConverter(null, updatedDiseases);
      // if any of the saves produced an error, err would equal that error
    });
  }

  getMonarchObjectArray(input, function(diseases) {
    async.each(diseases, convertDisease, function(err){
    });
  });

  /*
  getDrugs(input, function(results) {
    console.log(results);
  });

  getPathways(input, function(results) {
    console.log(results);
  });
  //*/

});

var server = app.listen(3333, function() {
  console.log("Listening to the port %d", server.address().port);
});
