import requests


HEADERS = {'accept': 'application/json'}
MONARCH_DISEASE_URL = "http://monarchinitiative.org/disease/"


def search_monarch(disease_ids):
    ''' Searches monarch and returns the results'''

    diseases = []
    for disease_id in disease_ids:
        temp_id = disease_id.replace(':', '_')
        temp_url = MONARCH_DISEASE_URL + temp_id + '/gene_associations.json'
        try:
            disease = requests.get(temp_url, headers=HEADERS)
        except:
            print temp_id
        diseases.append(disease.json())
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
