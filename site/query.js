var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

var data = client.count(index: 'app', type: 'wikipathways');
console.log(data);
