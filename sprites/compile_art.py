"""Compile illustrated source poses into editable vector path data.

No PNG is embedded in the generated JavaScript or runtime SVG. The six
independent silhouettes are normalized by component bounds, not grid crops.
"""
from pathlib import Path
import json
import hashlib
import math
import re
import shutil
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'.tools'))
import vtracer
SOURCES={
 'beelzebabs':'/workspace/generated_images/exec-e77148b4-aa13-4f7e-b159-edd39bd5b057.png',
 'mothmanager':'/workspace/generated_images/exec-5c1e0d7c-5342-47a8-9090-a7a22aefbdbe.png',
 'litigator':'/workspace/generated_images/exec-22a2450b-05c1-4d70-bfc7-3c4dbf24f64d.png',
 'greg':'/workspace/generated_images/exec-03c8e6bd-a14c-4272-9af2-211cba47bb7f.png',
 'john':'/workspace/generated_images/exec-7da19719-b8cd-435c-bb32-6e3abb0059e7.png',
 'maya':'/workspace/generated_images/exec-3f603c7f-a973-4175-b05f-857aee24e7e5.png',
 'brad':'/workspace/generated_images/exec-eb1f0d88-bb2b-41be-8ea1-0c68359b9d93.png',
}
FRAME_NAMES={
 'demon':['idle','writing','stamping','voting','celebrate','shocked'],
 'human':['idle','talking','angry','embarrassed','celebrate','shocked'],
}

BUILD={'version':3,'tracer':'vtracer','mode':'spline','color_precision':5}

def simplify(points,tolerance=.65):
    if len(points)<4:return points
    pts=np.asarray(points,dtype=float)
    def rdp(arr):
        if len(arr)<3:return arr
        a,b=arr[0],arr[-1];delta=b-a;length=np.linalg.norm(delta)
        distances=np.linalg.norm(arr-a,axis=1) if length==0 else np.abs(delta[0]*(a[1]-arr[:,1])-(a[0]-arr[:,0])*delta[1])/length
        index=int(np.argmax(distances))
        if distances[index]<=tolerance:return arr[[0,-1]]
        return np.concatenate((rdp(arr[:index+1])[:-1],rdp(arr[index:])))
    # Split a closed contour at an opposing vertex to avoid a zero-length chord.
    half=len(pts)//2
    reduced=np.concatenate((rdp(pts[:half+1])[:-1],rdp(np.concatenate((pts[half:],pts[:1])))))
    return reduced.tolist()

def trace_mask(mask,min_area=2.5,tolerance=.65):
    padded=np.pad(mask,1)
    neighbors=[padded[:-2,1:-1],padded[1:-1,2:],padded[2:,1:-1],padded[1:-1,:-2]]
    edges=defaultdict(list)
    for direction,other in enumerate(neighbors):
        ys,xs=np.where(mask&~other)
        for x,y in zip(xs.tolist(),ys.tolist()):
            if direction==0:a,b=(x,y),(x+1,y)
            elif direction==1:a,b=(x+1,y),(x+1,y+1)
            elif direction==2:a,b=(x+1,y+1),(x,y+1)
            else:a,b=(x,y+1),(x,y)
            edges[a].append(b)
    loops=[]
    while edges:
        start=next(iter(edges));point=start;loop=[]
        while True:
            loop.append(point)
            following=edges[point].pop()
            if not edges[point]:del edges[point]
            point=following
            if point==start:break
        if len(loop)>=4:
            area=abs(sum(loop[i][0]*loop[(i+1)%len(loop)][1]-loop[(i+1)%len(loop)][0]*loop[i][1] for i in range(len(loop))))/2
            if area>=min_area:loops.append(simplify(loop,tolerance=tolerance))
    return loops

def hsv(rgb):
    import colorsys
    return colorsys.rgb_to_hsv(*(v/255 for v in rgb))

def semantic_color(name,rgb):
    h,s,v=hsv(rgb);h*=360
    if name=='norm' and .28<v<.85 and s<.18:return 'body'
    if v<.24 or s<.12:return 'fixed'
    if name=='beelzebabs' and 250<h<315 and s>.3:return 'accent'
    if name in ['mothmanager','litigator'] and (h>325 or h<15) and s>.45:return 'accent'
    if name=='greg' and 230<h<315 and s>.15:return 'accent'
    if name=='beelzebabs' and (h>325 or h<18) and s>.38:return 'body'
    if name=='mothmanager' and 245<h<308 and s>.15:return 'body'
    if name=='litigator' and 38<h<68 and s>.3:return 'body'
    if name=='greg' and 110<h<180 and s>.15:return 'body'
    if name=='velvet' and 205<h<245 and s>.3:return 'body'
    if name=='velvet' and 315<h<355 and s>.3:return 'accent'
    if name=='bonejamin' and 12<h<35 and s>.5 and v>.35:return 'body'
    if name=='bonejamin' and 275<h<335 and s>.25:return 'accent'
    if name=='cerberus' and 195<h<235 and s>.35:return 'body'
    if name=='cerberus' and 155<h<195 and s>.25:return 'accent'
    if name=='dolly' and 325<h<355 and s>.45 and v>.35:return 'body'
    if name=='dolly' and 260<h<315 and s>.3:return 'accent'
    if name=='norm' and 10<h<40 and s>.45:return 'accent'
    if name=='gus' and 5<h<30 and s>.3:return 'body'
    if name=='gus' and 325<h<360 and s>.25:return 'accent'
    if name=='dot' and 315<h<350 and s>.3:return 'body'
    if name=='dot' and 265<h<315 and s>.2:return 'accent'
    if name in ['john','maya','brad']:
        if name=='john' and 195<h<250 and s>.35:return 'clothing'
        if name=='maya' and 245<h<300 and s>.25:return 'clothing'
        if name=='brad' and 8<h<30 and s>.5 and v>.55:return 'clothing'
        if 10<h<42 and s>.25 and v>.46:return 'skin'
        if 8<h<50 and v<.5:return 'hair'
    return 'fixed'

def compile_source(name,path):
    image=Image.open(path).convert('RGBA');rgba=np.asarray(image)
    labels,total=ndimage.label(rgba[:,:,3]>128)
    counts=np.bincount(labels.ravel());objects=ndimage.find_objects(labels)
    candidates=[(i,b) for i,b in enumerate(objects,1) if b and counts[i]>4000]
    candidates=sorted(candidates,key=lambda item:counts[item[0]],reverse=True)[:6]
    if len(candidates)!=6:raise ValueError(f'{name}: expected six separate silhouettes, found {len(candidates)}')
    candidates.sort(key=lambda item:(0 if (item[1][0].start+item[1][0].stop)/2<image.height/2 else 1,(item[1][1].start+item[1][1].stop)/2))
    max_side=max(max(b[1].stop-b[1].start,b[0].stop-b[0].start) for _,b in candidates)
    scale=442/max_side
    frames=[];kind='human' if name in ['john','maya','brad'] else 'demon'
    for frame_index,(label,b) in enumerate(candidates):
        crop=rgba[b].copy();mask=labels[b]==label
        crop[~mask,:3]=0;crop[:,:,3]=np.where(mask,255,0)
        height,width=mask.shape
        offset_x=256-width*scale/2;offset_y=472-height*scale
        temporary=ROOT/'art-sources'/'normalized';temporary.mkdir(exist_ok=True)
        source_file=temporary/f'{name}-{frame_index}.png'
        vector_file=source_file.with_suffix('.svg')
        Image.fromarray(crop).save(source_file)
        vtracer.convert_image_to_svg_py(str(source_file),str(vector_file),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=3,color_precision=5,layer_difference=24,corner_threshold=60,length_threshold=3.5,max_iterations=10,splice_threshold=45,path_precision=2)
        paths=[]
        for node in ET.parse(vector_file).getroot().iter('{http://www.w3.org/2000/svg}path'):
            fill=node.get('fill','#000000')
            color=[int(fill[i:i+2],16) for i in [1,3,5]]
            paths.append({'fill':fill,'semantic':semantic_color(name,color),'d':node.get('d'),'transform':node.get('transform','')})
        frames.append({'name':FRAME_NAMES[kind][frame_index],'paths':paths,'transform':f'translate({offset_x:.2f} {offset_y:.2f}) scale({scale:.6f})','bounds':[round(offset_x,2),round(offset_y,2),round(offset_x+width*scale,2),472]})
        print(f'{name}/{frames[-1]["name"]}: {len(paths)} color paths',flush=True)
    return {'kind':kind,'build':BUILD,'frames':frames}

def main():
    extra=ROOT/'art-sources'/'sources.json'
    sources=dict(SOURCES)
    if extra.exists():sources.update(json.loads(extra.read_text()))
    (ROOT/'art-sources').mkdir(exist_ok=True)
    library={}
    destination=ROOT/'src'/'compiled-art.mjs'
    if destination.exists():
        existing=destination.read_text().split('export const ART_LIBRARY=',1)[1].strip().rstrip(';')
        library=json.loads(existing)
    approved_path=ROOT/'concepts'/'round-two'/'compiled-concepts.mjs'
    approved=json.loads(approved_path.read_text().split('export const CONCEPT_ART=',1)[1].strip().rstrip(';')) if approved_path.exists() else {}
    for name,path in sources.items():
        local=ROOT/'art-sources'/f'{name}-poses.png'
        if Path(path).exists() and Path(path).resolve()!=local.resolve():shutil.copyfile(path,local)
        if not local.exists():raise FileNotFoundError(f'Missing source atlas: {local}')
        source_hash=hashlib.sha256(local.read_bytes()).hexdigest()
        if name not in library or library[name].get('build')!=BUILD or library[name].get('sourceHash',source_hash)!=source_hash:library[name]=compile_source(name,local)
        library[name]['sourceHash']=source_hash
        if name in ['norm','gus','dot'] and name in approved:
            # The opening portrait is the exact design selected from casting.
            # Match its scale and baseline to the new authored acting set.
            reference=approved[name];idle=library[name]['frames'][0]
            factor=(472-idle['bounds'][1])/(reference['bounds'][3]-reference['bounds'][1])
            values=[float(n) for n in re.findall(r'[-+]?\d*\.?\d+',reference['transform'])]
            tx=256+(values[0]-256)*factor;ty=472-(479-values[1])*factor
            idle['paths']=[{'fill':p['fill'],'semantic':p['role'],'d':p['d'],'transform':p.get('transform','')} for p in reference['paths']]
            idle['transform']=f'translate({tx:.2f} {ty:.2f}) scale({values[2]*factor:.6f})'
            idle['bounds']=[round(tx,2),round(ty,2),round(256+(reference['bounds'][2]-256)*factor,2),472]
            idle['approvedSourceHash']=reference['sourceHash']
        for frame in library[name]['frames']:
            for item in frame['paths']:
                item['semantic']=semantic_color(name,[int(item['fill'][i:i+2],16) for i in [1,3,5]])
                if name=='brad' and item['semantic']=='clothing':
                    # Warm skin and orange cloth share hues. Keep isolated
                    # head/hand highlights out of the jacket palette region.
                    position=re.search(r'translate\([^, ]+[, ]+([-0-9.]+)',item.get('transform',''))
                    scale_value=float(re.search(r'scale\(([-0-9.]+)',frame['transform']).group(1))
                    source_height=(472-frame['bounds'][1])/scale_value
                    values=[float(v) for v in re.findall(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?',item['d'])]
                    if position and values and float(position.group(1))+max(values[1::2])<source_height*.35:item['semantic']='skin'
    destination.write_text('/** Generated vector geometry. Rebuild with compile_art.py. No bitmap data. */\nexport const ART_LIBRARY='+json.dumps(library,separators=(',',':'))+';\n')
    print(f'Compiled {len(library)} archetypes / {sum(len(item["frames"]) for item in library.values())} poses → {destination.stat().st_size:,} bytes')

if __name__=='__main__':main()
