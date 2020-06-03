import csv

FILE_IN = 'fsf_in.csv'
FILE_OUT = 'fsf_out.csv'

CASE_INDEX = 0
CATEGORY_INDEX = 1
TITLE_INDEX = 5
PHOTO_PRIORITY_INDEX = 29
PHOTO_STATUS_INDEX = 30
VERNON_INDEX = 2
ACMI_INDEX = 3

data = []
with open(FILE_IN) as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        data.append(row)

useful_data = []
for row in data:
    if 'CoC' in row[CASE_INDEX]:
        useful_data.append(row)

with open(FILE_OUT, 'w') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=['case', 'category', 'title', 'vernon_id', 'acmi_id', 'photo_priority', 'photo_status', 'current_location'])
    writer.writeheader()
    for i, row in enumerate(useful_data):
        case = row[CASE_INDEX].replace('\n', ' ')
        category = row[CATEGORY_INDEX].replace('\n', ' ')
        title = row[TITLE_INDEX].replace('\n', ' ')
        writer.writerow({
            'case': case,
            'category': category,
            'title': title,
            'vernon_id': row[VERNON_INDEX],
            'acmi_id': row[ACMI_INDEX],
            'photo_priority': '',
            'photo_status': '',
            'current_location': row[14]
        })
