"""Extract and vectorize the twelve idle casting studies.

This deliberately leaves the established six-pose game library untouched.
All displayed concepts are rendered from editable path data, not PNG embeds.
"""
from pathlib import Path
import hashlib
import html
import json
import shutil
import sys
import xml.etree.ElementTree as ET
import colorsys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / '.tools'))
import vtracer

SOURCES = [
    ('heavyweights', ['norm', 'barry', 'gus'], '/workspace/generated_images/exec-b14aa8ed-eebd-4427-b361-520eb65d386e.png'),
    ('strange', ['slugworth', 'ned', 'sue'], '/workspace/generated_images/exec-be25fe2f-bd73-42a9-b6b4-0e257ae46f9b.png'),
    ('oddities', ['fergus', 'connie', 'winnie'], '/workspace/generated_images/exec-259b72e4-0b8b-4aa2-91ad-9bad7074a717.png'),
    ('scruffy', ['edgar', 'dot', 'milton'], '/workspace/generated_images/exec-80aa33d9-ba7a-4105-b4bb-b8c39dd3746f.png'),
]
NAMES = dict(zip(
    ['norm','barry','gus','slugworth','ned','sue','fergus','connie','winnie','edgar','dot','milton'],
    ['Norm Goyle','Barry Burden','Gus Grumble','Slugworth','Ned Kettle','Sue Nami','Fergus','Connie','Winnie Wail','Edgar','Dot','Milton']))

def role(identity, fill):
    rgb = [int(fill[i:i+2], 16) / 255 for i in (1,3,5)]
    h, s, v = colorsys.rgb_to_hsv(*rgb)
    h *= 360
    if v < .24:
        return 'fixed'
    if identity == 'norm' and s < .18 and .28 < v < .85:
        return 'body'
    if s < .14:
        return 'fixed'
    body = {
        'barry': (270,315), 'gus': (5,30), 'slugworth': (35,65), 'ned': (12,40),
        'sue': (260,320), 'fergus': (30,65), 'connie': (15,50), 'winnie': (60,105),
        'edgar': (35,65), 'dot': (315,345), 'milton': (5,28),
    }.get(identity)
    if body and body[0] < h < body[1]:
        return 'body'
    accent = {
        'norm': (10,40), 'barry': (10,40), 'gus': (325,360), 'slugworth': (325,360),
        'ned': (270,320), 'sue': (35,60), 'fergus': (135,200), 'connie': (320,360),
        'winnie': (25,58), 'edgar': (330,360), 'dot': (170,215), 'milton': (130,180),
    }[identity]
    return 'accent' if accent[0] < h < accent[1] else 'fixed'

def main():
    for directory in ['sources','normalized','exports']:
        (HERE / directory).mkdir(parents=True, exist_ok=True)
    library = {}
    receipt = {'state':'idle concept study', 'canvas':[512,512], 'source_atlases':[], 'characters':[]}
    for group, identities, source in SOURCES:
        archive = HERE / 'sources' / f'{group}.png'
        if Path(source).exists():
            shutil.copyfile(source, archive)
        rgba = np.array(Image.open(archive).convert('RGBA'))
        labels, _ = ndimage.label(rgba[:,:,3] > 128)
        counts = np.bincount(labels.ravel())
        objects = ndimage.find_objects(labels)
        candidates = [(label, box) for label, box in enumerate(objects, 1) if box and counts[label] > 4000]
        assert len(candidates) == 3, f'{group}: expected three separate characters, found {len(candidates)}'
        candidates.sort(key=lambda item: (item[1][1].start + item[1][1].stop) / 2)
        source_hash = hashlib.sha256(archive.read_bytes()).hexdigest()
        receipt['source_atlases'].append({'group':group,'file':f'sources/{group}.png','sha256':source_hash})
        for identity, (label, box) in zip(identities, candidates):
            crop = rgba[box].copy()
            mask = labels[box] == label
            crop[~mask,:3] = 0
            crop[:,:,3] = np.where(mask,255,0)
            height, width = mask.shape
            scale = min(460 / width, 450 / height)
            tx, ty = 256 - width * scale / 2, 479 - height * scale
            normalized = HERE / 'normalized' / f'{identity}.png'
            traced = HERE / 'normalized' / f'{identity}.svg'
            Image.fromarray(crop).save(normalized)
            vtracer.convert_image_to_svg_py(str(normalized),str(traced),
                colormode='color',hierarchical='stacked',mode='spline',filter_speckle=2,
                color_precision=5,layer_difference=20,corner_threshold=60,length_threshold=3,
                max_iterations=10,splice_threshold=45,path_precision=2)
            paths = []
            for element in ET.parse(traced).getroot().iter('{http://www.w3.org/2000/svg}path'):
                fill = element.get('fill','#000000')
                paths.append({'fill':fill,'role':role(identity,fill),'d':element.get('d'),'transform':element.get('transform','')})
            transform = f'translate({tx:.2f} {ty:.2f}) scale({scale:.6f})'
            library[identity] = {'name':NAMES[identity],'state':'idle','group':group,
                'sourceHash':source_hash,'transform':transform,'bounds':[round(tx,2),round(ty,2),round(tx+width*scale,2),479],
                'paths':paths}
            svg_paths = ''.join(f'<path fill="{p["fill"]}" data-palette="{p["role"]}" d="{p["d"]}" transform="{p["transform"]}"/>' for p in paths)
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="{html.escape(NAMES[identity])}"><title>{html.escape(NAMES[identity])} — idle concept study</title><g transform="{transform}">{svg_paths}</g></svg>'
            (HERE / 'exports' / f'{identity}.svg').write_text(svg)
            receipt['characters'].append({'id':identity,'name':NAMES[identity],'state':'idle','group':group,'paths':len(paths),
                'source_bounds':[box[1].start,box[0].start,box[1].stop,box[0].stop],'bounds':library[identity]['bounds']})
            print(f'{identity}: {len(paths):,} editable paths',flush=True)
    (HERE / 'compiled-concepts.mjs').write_text('/** Generated idle concept geometry. No bitmap data. Rebuild with compile.py. */\nexport const CONCEPT_ART='+json.dumps(library,separators=(',',':'))+';\n')
    (HERE / 'manifest.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(f'Compiled {len(library)} distinct idle studies.',flush=True)

if __name__ == '__main__':
    main()
