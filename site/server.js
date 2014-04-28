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

// input : array of disease ids


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

  async.waterfall([
      function(callback){
          getMonarchObjectArray(input, function(diseases) {




            var updatedDiseases = [];
            function convertDisease(diseaseToConvert, callbackDiseaseConverter) {
              console.log('diseaseToConvert');
              console.log(diseaseToConvert);
              var gene_associations = diseaseToConvert['gene_associations'];
              diseaseToConvert.genes = [];
              var genes = [];
              async.each(gene_associations, function(gene_association, callbackGeneAssociation) {
                //console.log('gene_association');
                //console.log(gene_association);
                var geneId = gene_association.gene.id;
                console.log('geneId');
                console.log(geneId);
                diseaseToConvert.genes.push(geneId.replace(':', '_'));
                //console.log('diseaseToConvert');
                //console.log(diseaseToConvert.toString());
                //console.log(diseaseToConvert);
                //disease.genes.push(geneId);
                //updatedDiseases.push(disease);
                callbackGeneAssociation(null);
              }, function(err){
                console.log('err');
                console.log(err);
                console.log('updatedDiseases');
                console.log(updatedDiseases);
                console.log(updatedDiseases.toString());
                updatedDiseases.push(diseaseToConvert);
                callbackDiseaseConverter(null, updatedDiseases);
                // if any of the saves produced an error, err would equal that error
              });
            }






            async.each(diseases, convertDisease, function(err){
              console.log('updatedDiseases');
              console.log(updatedDiseases);
              callback(null, updatedDiseases);
            });
          });
      },
      function(diseases, callback){

        var allGenes = [];
        function getAllGenes(updatedDisease, callbackGenes) {
          if (!!updatedDisease && !!updatedDisease.genes) {
            allGenes = allGenes.concat(updatedDisease.genes);
            callbackGenes(null, allGenes);
          }
          else {
            callbackGenes(null, allGenes);
          }
        }



        async.each(diseases, getAllGenes, function(err){
          callback(null, allGenes);
        });
      },
      function(allGenes, callback){


        var updatedMonarchObjectArray = [];
          function getMonarchObjectArrayUpdated(input, callbackOutside) {
            console.log('input2');
            console.log(input);
            var monarchObjectArray = [];
            // input : disease id string
            function getMonarchObjectUpdated(input, callbackEach) {
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
                port: '80'
                //headers: {'accept': 'application/json'}
              };
              callback = function(response) {
                var str = '';
                response.on('data', function (chunk) {
                  str += chunk;
                });
                response.on('end', function (data) {
                  //console.log('str');
                  //console.log(str);
                  var firstCharacter = str.substring(0,1);
                  if(firstCharacter !== '<') {
                    var monarchObjectJson = JSON.parse(str);
                    if(sub_String.toLowerCase() == 'omim') {
                      callbackEach();
                    } else {
                      console.log('monarchObjectJson');
                      console.log(monarchObjectJson);
                      var references = monarchObjectJson.references;
                      if (!!references) {
                        monarchObjectArray.push(references);
                        callbackEach();
                      }
                      else {
                        callbackEach();
                      }
                    }
                  }
                  else {
                    callbackEach();
                  }
                });
              };

              var req = http.request(options, callback);
              req.end();
            }
            async.eachSeries(input, getMonarchObjectUpdated, function() {
              console.log('monarchObjectArray');
              console.log(monarchObjectArray);
              updatedMonarchObjectArray = updatedMonarchObjectArray.concat(monarchObjectArray);
              callbackOutside(monarchObjectArray);
            });
          }

          async.each(allGenes, getMonarchObjectArrayUpdated, function(err){
            callback(null, updatedMonarchObjectArray);
            //callback(null, updatedMonarchObjectArray);
          });
          // arg1 now equals 'three'
      }
  ], function (err, result) {
            console.log('result');
            console.log(result);
     // result now equals 'done'    
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
