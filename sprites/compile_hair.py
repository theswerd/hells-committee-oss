"""Compile complete Maya hairstyles into continuous, smooth vector layers.

Hair is isolated spatially from the face, neck and jewelry before it is traced.
Binary spline tracing keeps long curl lines intact without copying individual
color speckles into the resulting geometry.
"""
from pathlib import Path
import hashlib,json,re,subprocess,tempfile
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
import xml.etree.ElementTree as ET
from compile_art import vtracer
from compile_faces import source_poses

ROOT=Path(__file__).resolve().parent
NAMES=['idle','talking','angry','embarrassed','celebrate','shocked']
BOTTOMS=[205,210,205,205,195,200]
EYES=[
 [(134,80,181,110),(184,77,225,108)],
 [(133,78,176,110),(180,72,219,104)],
 [(162,93,213,122),(213,82,250,116)],
 [(106,83,146,114),(147,97,179,124)],
 [(140,66,190,90),(193,53,241,84)],
 [(131,63,181,105),(177,60,215,100)],
]
PONY_TRANSFORMS=['translate(0 0)','translate(-3 3)','translate(20 9)','translate(0 2) scale(.82 1)','translate(17 -8)','translate(3 -2)']
CROWN_TRANSFORMS=['translate(0 0)','translate(-7 4)','translate(26 10)','translate(-30 5)','translate(12 -7)','translate(2 -11)']
PONY_CURLS=[
 'M58 12 C37 4 19 22 31 36 C43 50 57 40 48 32 C40 25 30 34 36 40',
 'M88 17 C66 11 54 29 63 42 C73 57 91 48 83 37 C77 30 67 35 72 42',
 'M29 42 C10 45 10 68 27 73 C42 78 53 64 42 55 C33 48 23 55 28 62',
 'M58 52 C41 44 33 63 42 76 C52 90 73 84 69 71 C65 61 52 64 54 74',
 'M97 46 C81 44 74 62 86 73 C98 83 111 69 101 62 C94 57 89 66 96 69',
 'M16 79 C4 91 15 111 30 108 C43 106 45 90 34 86 C25 83 20 92 27 96',
 'M48 87 C33 83 27 104 40 113 C54 123 69 108 59 100 C52 94 43 101 48 107',
 'M81 82 C67 90 70 111 86 114 C103 118 113 101 103 94 C95 88 88 96 93 102',
 'M22 119 C8 128 16 147 30 144 C43 141 46 126 36 124 C29 122 24 130 29 134',
 'M53 121 C39 130 45 153 61 151 C77 149 82 133 71 128 C64 124 57 132 62 137',
 'M98 119 C84 120 78 142 91 152 C105 163 119 148 111 138 C105 131 96 138 102 144',
 'M22 153 C10 161 16 179 28 178 C41 177 48 164 39 159 C32 155 26 163 31 167',
 'M61 158 C45 157 41 177 55 186 C68 194 82 181 75 171 C70 164 61 169 65 176',
 'M97 160 C85 168 92 185 104 183 C117 181 122 169 112 166 C106 164 101 170 106 174',
]
CROWN_CURLS=[
 'M118 35 C127 14 163 10 185 26 C196 34 200 38 205 40',
 'M114 48 C128 30 153 23 172 34 C181 39 187 47 189 50',
 'M138 42 C137 26 148 22 162 30 C171 36 166 41 157 38',
 'M182 22 C198 15 216 27 217 41 C217 50 225 52 229 44',
]
NECKS=[
 [(135,133),(161,134),(178,144),(184,187),(137,185)],
 [(128,135),(161,135),(178,151),(176,188),(135,181)],
 [(175,145),(218,147),(236,178),(185,189),(173,173)],
 [(97,132),(135,132),(151,156),(132,188),(99,180)],
 [(151,116),(191,120),(209,151),(192,179),(157,166)],
 [(132,121),(179,123),(196,153),(190,188),(138,178)],
]

def polygons(path):
    tokens=re.findall(r'[MLCZ]|[-+]?\d*\.?\d+',path);i=0;point=(0,0);polygon=[]
    result=[]
    while i<len(tokens):
        command=tokens[i];i+=1
        if command in ['M','L']:
            point=(float(tokens[i]),float(tokens[i+1]));i+=2
            if command=='M' and polygon:result.append(polygon);polygon=[]
            polygon.append(point)
        elif command=='C':
            values=list(map(float,tokens[i:i+6]));i+=6
            a=point;b=values[:2];c=values[2:4];d=values[4:6]
            for t in np.linspace(0,1,15)[1:]:
                u=1-t
                polygon.append(tuple(u**3*a[n]+3*u*u*t*b[n]+3*u*t*t*c[n]+t**3*d[n] for n in [0,1]))
            point=tuple(d)
        elif command=='Z':
            if polygon:result.append(polygon);polygon=[]
    if polygon:result.append(polygon)
    return result

def remove_small(mask,minimum):
    labels,_=ndimage.label(mask);counts=np.bincount(labels.ravel());keep=counts>=minimum;keep[0]=False
    return keep[labels]

def trace(mask,minimum=5):
    mask=remove_small(mask,minimum)
    if not mask.any():return []
    with tempfile.TemporaryDirectory() as directory:
        src=Path(directory)/'mask.png';target=Path(directory)/'mask.svg'
        Image.fromarray(np.where(mask,0,255).astype('uint8')).save(src)
        vtracer.convert_image_to_svg_py(str(src),str(target),colormode='binary',mode='spline',filter_speckle=1,corner_threshold=65,length_threshold=1.35,max_iterations=10,splice_threshold=45,path_precision=3)
        return [{'d':node.get('d'),'transform':node.get('transform','')} for node in ET.parse(target).getroot().iter('{http://www.w3.org/2000/svg}path')]

def main():
    js="import {getMayaPaletteMasks} from './src/facial-details.mjs'; process.stdout.write(JSON.stringify(['idle','talking','angry','embarrassed','celebrate','shocked'].map(name=>getMayaPaletteMasks(name).face)));"
    face_masks=json.loads(subprocess.run(['node','--input-type=module','-e',js],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
    atlas=ROOT/'art-sources/maya-poses.png';poses=source_poses(atlas);frames={}
    for i,(name,source) in enumerate(zip(NAMES,poses)):
        rgba=np.array(source);rgb=rgba[:,:,:3]/255;hsv=np.array(source.convert('RGB').convert('HSV'))/255
        hue=hsv[:,:,0]*360;visible=rgba[:,:,3]>128;value=rgb.max(axis=2)
        allowed_image=Image.new('L',source.size);draw=ImageDraw.Draw(allowed_image)
        draw.rectangle((0,0,source.width,BOTTOMS[i]),fill=255)
        for polygon in polygons(face_masks[i]):draw.polygon(polygon,fill=0)
        draw.polygon(NECKS[i],fill=0)
        for box in EYES[i]:draw.rectangle(box,fill=0)
        allowed=np.array(allowed_image)>0
        skin=(hue>5)&(hue<35)&(hsv[:,:,1]>.28)&(value>.58)&visible
        skin=ndimage.binary_dilation(ndimage.binary_fill_holes(ndimage.binary_closing(skin,iterations=2)),iterations=2)
        gold=(hue>30)&(hue<75)&(hsv[:,:,1]>.25)&(value>.35)&(rgb[:,:,1]>rgb[:,:,0]*.61)&visible
        gold=ndimage.binary_dilation(gold,iterations=2)
        candidate=visible&allowed&~skin&~gold&(hue>4)&(hue<50)&(value>.2)&(value<.7)
        hair=ndimage.binary_fill_holes(ndimage.binary_closing(candidate,iterations=1))
        hair=ndimage.binary_dilation(hair,iterations=1)&allowed&visible&~skin&~gold
        hair=remove_small(hair,25)
        # All detail masks use the complete hairstyle, not the face repair
        # window. Long curls therefore have no window boundary to stop at.
        frames[name]={
            'silhouette':trace(hair,25),
            'shadow':trace(hair&(value<.36),10),
            'highlight':trace(hair&(value>.47),12),
            'ink':trace(hair&(value<.265),7),
            'strands':[{'d':d,'transform':PONY_TRANSFORMS[i]} for d in PONY_CURLS]+[{'d':d,'transform':CROWN_TRANSFORMS[i]} for d in CROWN_CURLS],
            'neck':NECKS[i],
        }
        print(name,':',sum(len(v) for k,v in frames[name].items() if k!='neck'),'curve layers',flush=True)
    target=ROOT/'src/compiled-hair.mjs'
    target.write_text('/** Complete source-isolated hairstyles. Rebuild with compile_hair.py. */\nexport const MAYA_HAIR='+json.dumps({'sourceHash':hashlib.sha256(atlas.read_bytes()).hexdigest(),'frames':frames},separators=(',',':'))+';\n')
    print(f'Compiled continuous hair geometry: {target.stat().st_size:,} bytes')

if __name__=='__main__':main()
