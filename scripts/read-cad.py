"""Extract independently decodable TEXT entities; unsupported DWG objects are not geometry evidence."""
import re,json
from pathlib import Path
p=Path('.local-cad/drawing.json')
text=p.read_text(encoding='utf-8',errors='replace')
objects=[]
for block in re.findall(r'^    \{\n.*?^    \}',text,re.M|re.S):
    if not re.search(r'"entity": "(?:TEXT|MTEXT|INSERT)"',block[:100]): continue
    try: objects.append(json.loads(block,strict=False))
    except ValueError: pass
Path('.local-cad/texts.json').write_text(json.dumps(objects,ensure_ascii=False),encoding='utf-8')
texts=[o for o in objects if o['entity']!='INSERT']
print('text entities',len(texts))
print(json.dumps(texts[:2],ensure_ascii=False))
for o in texts:
    t=o.get('text_value',o.get('text',''))
    if any(w in t for w in ['平面','标高','干燥','转鼓','挤出','纺丝','楼','层','结晶','布置']):
        print(t,o.get('ins_pt',o.get('insertion_pt','')))
