from pyelasticsearch import ElasticSearch
from pyelasticsearch import IndexAlreadyExistsError

import json
import re
from glob import glob

es = ElasticSearch('http://localhost:9200/')


def index_wikipathways():
    ''' Index wiki pathways in elasticsearch '''

    doc_type = 'wikipathways'
    counter = 0
    document = {}
    for filename in glob('../wp-json/*.json'):
        with open(filename) as fp:
            doc = json.load(fp)
            try:
                counter = counter + 1
                del(doc['@context'])
                gene_array = doc.keys()[0]
                gene_links = []
                document['name'] = doc[gene_array]['name']
                document['id'] = doc[gene_array]['id']
                for g in doc[gene_array]['elements']:
                    try:
                        if 'unificationXref' in g:
                            data = re.sub('http://identifiers.org/ensembl/', '', g['unificationXref'])
                            gene_links.append(data)
                    except:
                        print "There is a error in parsing pathways"
                document['genes'] = gene_links
                es.index('app', doc_type, document, counter)
            except:
                print "There is a error during indexing"


def main():
    ''' Index wiki pathways and drugs in the Elasticsearch '''

    wiki_index = 'app'
    try:
        es.create_index(wiki_index)
    except IndexAlreadyExistsError:
        es.delete_index(wiki_index)
        es.create_index(wiki_index)

    index_wikipathways()


if __name__ == main():
    main()
