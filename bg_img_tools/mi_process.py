import csv

data = []
with open('mi_in.csv') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        data.append(row)

useful_data = []
for row in data:
    if (
        'MI-01-C02' in row[3] or
        'MI-02-C01' in row[3] or
        'MI-02-C02' in row[3] or
        'MI-04-C01' in row[3] or
        'MI-05-C02' in row[3] or
        'MI-05-C03' in row[3] or
        'MI-08-C01' in row[3]
        ):
        useful_data.append(row)

with open('mi_out.csv', 'w') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=['case', 'category', 'title', 'vernon_id', 'acmi_id', 'photo_priority', 'photo_status'])
    writer.writeheader()
    for i, row in enumerate(useful_data):
        case = row[3].replace('\n', ' ')
        category = row[2].replace('\n', ' ')
        title = row[9].replace('\n', ' ')
        photo_priority = row[33].replace('\n', ' ')
        photo_status = row[34].replace('\n', ' ')
        writer.writerow({
            'case': case,
            'category': category,
            'title': title,
            'vernon_id': row[4],
            'acmi_id': row[5],
            'photo_priority': photo_priority,
            'photo_status': photo_status
        })
