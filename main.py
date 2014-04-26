import requests


HEADERS = {'accept': 'application/json'}
MONARCH_PHENOTYPE_URL = "http://monarchinitiative.org/phenotype/"
MONARCH_GENEOTYPE_URL = "http://monarchinitiative.org/genotype/"


def search_monarch(term_type, term):
    ''' Searches monarch and returns the results'''

    if term_type == "gene":
        url = MONARCH_GENEOTYPE_URL
    else:
        url = MONARCH_PHENOTYPE_URL
    response = requests.get(url + term + '.json', headers=HEADERS)
    return response.json()


def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Search multiple databases using this module",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument('--term-type', help="Item type")
    parser.add_argument('--term-name', help="Search term")
    args = parser.parse_args()
    term_type = args.term_type
    term = args.term_name
    results = search_monarch(term_type, term)


if __name__ == main():
    main()
