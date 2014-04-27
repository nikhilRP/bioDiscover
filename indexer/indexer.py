from pyelasticsearch import ElasticSearch
from pyelasticsearch import IndexAlreadyExistsError

import json
import re
from glob import glob

es = ElasticSearch('http://localhost:9200/')


def index_drugs():
    ''' Index drugs in elasticsearch '''

    print "Started indexing drugs, diseases and genes"
    doc_type_drugs = 'drugs'
    doc_type_genes = 'genes'
    doc_type_diseases = 'diseases'
    doc_type = doc_type_drugs
    with open('../data/diseases_drugs_genes_go.json') as fp:
        counter = gene_counter = disease_counter = 0
        for f in fp:
            doc = json.loads(f[0:-1])
            document = {}
            gene_links = []
            
            if 'http://bio2rdf.org/ncbigene_vocabulary:has_ensembl_gene_identifier' in doc:
                for d in doc['http://bio2rdf.org/ncbigene_vocabulary:has_ensembl_gene_identifier']:
                    d_id = re.sub('http://bio2rdf.org/ensembl:', '', d['@id'])
                    gene_links.append(d_id)
            
            if 'http://www.w3.org/2000/01/rdf-schema#label' in doc:
                document['@label'] = doc['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value']

            id_doc = re.sub('http://bio2rdf.org/', '', doc['@id'])
            
            if id_doc.startswith('ensembl'):
                d_i = re.sub('http://bio2rdf.org/ensembl:', '', doc['@id'])
                document['@id'] = d_i
                document['go_terms'] = []
                for d_go in doc['http://bio2rdf.org/networkofbiothings_vocabulary:go_term']:
                    d_go_curated = re.sub('http://bio2rdf.org/', '', d_go['@id'])
                    document['go_terms'].append(d_go_curated)

                gene_counter = gene_counter + 1
                doc_type = doc_type_genes
                try:
                    es.index('app', doc_type_genes, document, gene_counter)
                except:
                    print "Error indexing genes"
            elif id_doc.startswith('omim'):
                d_i = re.sub('http://bio2rdf.org/', '', doc['@id'])
                document['@id'] = d_i
                doc_type = doc_type_diseases
                disease_counter = disease_counter + 1
                try:
                    es.index('app', doc_type_diseases, document, disease_counter)
                except:
                    print "Error indexing diseases"
            else:
                counter = counter + 1
                document['genes'] = gene_links
                try:
                    es.index('app', doc_type, document, counter)
                except:
                    print "Error indexing drugs"


def index_wikipathways():
    ''' Index wiki pathways in elasticsearch '''

    print "Started indexing Wiki pathways"
    doc_type = 'wikipathways'
    counter = 0
    document = {}
    for filename in glob('../data/wp-json/*.json'):
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
    index_drugs()


if __name__ == main():
    main()
