# -*- coding: utf-8 -*-
import json

with open('/tmp/figma_nodes.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = data.get('nodes', {})

def print_tree(node, indent=0):
    if not node:
        return
    name = node.get('name', '')
    ntype = node.get('type', '')
    size = ''
    if 'absoluteBoundingBox' in node:
        bb = node['absoluteBoundingBox']
        size = f" [{int(bb['width'])}x{int(bb['height'])}]"
    chars = ''
    if ntype == 'TEXT':
        txt = node.get('characters', '')[:80]
        chars = f" => {repr(txt)}"
    # color info
    fills = node.get('fills', [])
    color_info = ''
    for fill in fills[:1]:
        if fill.get('type') == 'SOLID':
            c = fill.get('color', {})
            r, g, b = int(c.get('r',0)*255), int(c.get('g',0)*255), int(c.get('b',0)*255)
            color_info = f" color=#{r:02x}{g:02x}{b:02x}"
    print(' ' * indent + f'[{ntype}] {name}{size}{chars}{color_info}')
    for child in node.get('children', []):
        print_tree(child, indent + 2)

for node_id, node_data in nodes.items():
    doc = node_data.get('document', {})
    bb = doc.get('absoluteBoundingBox', {})
    print(f'\n{"="*60}')
    print(f'Frame: {doc.get("name")} [{int(bb.get("width",0))}x{int(bb.get("height",0))}]')
    print('='*60)
    for child in doc.get('children', []):
        print_tree(child)
