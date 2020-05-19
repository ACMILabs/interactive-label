import csv

FILE_IN = 'mw_in.csv'
FILE_OUT = 'mw_out.csv'

CASE_INDEX = 6
CATEGORY_INDEX = 4
TITLE_INDEX = 11
PHOTO_PRIORITY_INDEX = 29
PHOTO_STATUS_INDEX = 30
VERNON_INDEX = 8
ACMI_INDEX = 7

CASES = ['MW-04-C01','MW-04-C02','MW-04-C03','MW-04-C04']

data = []
with open(FILE_IN) as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        data.append(row)

useful_data = []
for row in data:
    for case_code in CASES:
        if case_code in row[CASE_INDEX]:
            useful_data.append(row)
            break

with open(FILE_OUT, 'w') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=['case', 'category', 'title', 'vernon_id', 'acmi_id', 'photo_priority', 'photo_status'])
    writer.writeheader()
    for i, row in enumerate(useful_data):
        case = row[CASE_INDEX].replace('\n', ' ')
        category = row[CATEGORY_INDEX].replace('\n', ' ')
        title = row[TITLE_INDEX].replace('\n', ' ')
        photo_priority = row[PHOTO_PRIORITY_INDEX].replace('\n', ' ')
        photo_status = row[PHOTO_STATUS_INDEX].replace('\n', ' ')
        writer.writerow({
            'case': case,
            'category': category,
            'title': title,
            'vernon_id': row[VERNON_INDEX],
            'acmi_id': row[ACMI_INDEX],
            'photo_priority': photo_priority,
            'photo_status': photo_status
        })
