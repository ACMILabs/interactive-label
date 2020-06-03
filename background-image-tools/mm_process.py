import csv

CASE_INDEX = 2
CATEGORY_INDEX = 1
TITLE_INDEX = 9
PHOTO_PRIORITY_INDEX = 24
PHOTO_STATUS_INDEX = 26
VERNON_INDEX = 3
ACMI_INDEX = 4

data = []
with open('mm_in.csv') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        data.append(row)

useful_data = []
for row in data:
    if 'MM-05' in row[CASE_INDEX]:
        useful_data.append(row)

with open('mm_out.csv', 'w') as csvfile:
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
