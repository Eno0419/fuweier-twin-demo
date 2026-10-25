"""Read source cells/merge ranges without changing the workbook. Never infer missing tags."""
import sys, json, re, hashlib
from pathlib import Path
from collections import Counter
import openpyxl

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / 'src' / 'equipment-source.json'
wb = openpyxl.load_workbook(source, data_only=True)
records, sheets = [], []
for line, sheet in enumerate(wb, 1):
    merged = {}
    for area in sheet.merged_cells.ranges:
        for row in range(area.min_row, area.max_row + 1):
            for col in range(area.min_col, area.max_col + 1):
                merged[row, col] = (area.min_row, area.min_col)
    def cell(row, col):
        r, c = merged.get((row, col), (row, col))
        v = sheet.cell(r, c).value
        return '' if v is None else str(v).strip()
    headers = [cell(1, c) for c in range(1, 15)]
    groups = {}
    points = []
    for row in range(2, sheet.max_row + 1):
        name = cell(row, 4)
        if not name:
            assert not (cell(row, 7) or cell(row, 8)), f'Orphan point {sheet.title}:{row}'
            continue
        start = merged.get((row, 4), (row, 4))[0]
        if start not in groups:
            values = {h: cell(row, c) for c, h in enumerate(headers, 1)}
            note = values['备注']
            tag = re.search(r'设备位号[：:]\s*(.*?)(?=\n数量[：:]|\n原表行号|\n补充说明|$)', note, re.S)
            qty = re.search(r'数量[：:]([^\n]+)', note)
            main_start = merged.get((row, 3), (row, 3))[0]
            groups[start] = dict(id=f'XL{line}-R{start:03}', line=str(line), name=name,
                process=cell(row, 2), stage=cell(row, 1), mainName=cell(row, 3),
                mainRow=main_start, isMain=start == main_start,
                tag=tag.group(1).strip() if tag else '', quantity=qty.group(1).strip() if qty else '',
                sourceSheet=sheet.title, sourceRow=start, sourceEndRow=row,
                fields=values, points=[])
        record = groups[start]
        record['sourceEndRow'] = row
        # Only original non-empty point rows count; no forwarding from adjacent cells.
        code, title = cell(row, 7), cell(row, 8)
        if code or title:
            p = dict(id=f'XL{line}-P{row:03}', code=code, name=title, sourceRow=row,
                     note=cell(row, 14))
            record['points'].append(p)
            points.append(p)
    records.extend(groups.values())
    sheets.append(dict(name=sheet.title, line=str(line), rows=sheet.max_row,
        equipmentRecords=len(groups), pointRecords=len(points),
        codedPoints=sum(bool(p['code']) for p in points),
        missingCode=sum(not p['code'] for p in points)))
codes = Counter(p['code'] for r in records for p in r['points'] if p['code'])
for r in records:
    for p in r['points']:
        p['duplicateCode'] = bool(p['code'] and codes[p['code']] > 1)
payload = dict(filename=source.name, sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    headers=headers, sheets=sheets, records=records)
target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(sheets, ensure_ascii=False))
print('processes:', json.dumps(list(dict.fromkeys(r['process'] for r in records)), ensure_ascii=False))
print('main equipment:', json.dumps([(r['id'], r['name'], r['tag']) for r in records if r['isMain']], ensure_ascii=False))
