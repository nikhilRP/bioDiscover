import requests


HEADERS = {'accept': 'application/json'}
MONARCH_DISEASE_URL = "http://monarchinitiative.org/disease/"
MONARCH_GENE_URL = "http://monarchinitiative.org/gene/"
NCBI_EUTILS = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/"


def search_monarch(disease_ids):
    ''' Searches monarch and returns the results'''

    diseases = []
    for disease_id in disease_ids:
        temp_id = disease_id.replace(':', '_')
        temp_url = MONARCH_DISEASE_URL + temp_id + '.json'
        try:
            disease = requests.get(temp_url, headers=HEADERS)
            disease = disease.json()
            if 'gene_associations' in disease:
                for gene in disease['gene_associations']:
                    temp_gene_id = gene['gene']['id'].replace(':', '_')
                    temp_gene_url = MONARCH_GENE_URL + temp_gene_id + '.json'
                    g = requests.get(temp_gene_url, headers=HEADERS)
                    g = g.json()
                    for ref in g['references']:
                        if ref['source'] == 'Ensembl':
                            gene['gene']['ensembl_id'] = []
                            for i in ref['id']:
                                gene['gene']['ensembl_id'].append(i)
                    del(gene['regerences'])
            del(disease['@context'])
            del(disease['sim'])
            del(disease['pathway_associations'])
            diseases.append(disease)
        except:
            pass
    return diseases


def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Search multiple databases using this module",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument('--disease-ids', action='append', help="Search term")
    args = parser.parse_args()
    disease_ids = args.disease_ids
    diseases = search_monarch(disease_ids)


if __name__ == main():
    main()
