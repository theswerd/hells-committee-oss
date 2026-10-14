"""Preserve the two repaired Maya faces as complete, source-aligned SVG layers.

Unlike the silhouette tracer, this pass keeps every small color contour. It
does not drop tiny lash/eyebrow components or estimate their positions. Output
contains only path coordinates and semantic paints; no raster data is embedded.
"""
from pathlib import Path
import colorsys
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from compile_art import trace_mask, semantic_color

ROOT=Path(__file__).resolve().parent
SPECS={
 'angry': {
  'index':2,'box':[122,40,262,173],
  'clip':'M158 52 C182 49 214 52 231 60 C246 69 248 81 250 91 L255 102 L252 119 C255 139 240 157 218 159 L171 156 L162 163 L138 160 L128 144 L129 107 L143 83 Z',
  'parts':{'eye-right':[162,93,213,122],'eye-left':[213,82,250,116],'ear-right':[131,107,179,143]},
  'skin':[
   [(165,65),(181,60),(209,60),(227,68),(241,93),(246,104),(239,131),(225,146),(213,152),(194,149),(174,140),(160,129),(171,119),(158,107),(156,92),(164,77)],
   [(138,114),(145,113),(152,117),(156,123),(170,127),(171,133),(163,140),(149,137),(138,129),(133,121)],
  ],
 },
 'celebrate': {
  'index':4,'box':[110,25,253,151],
  'clip':'M147 35 C170 29 205 30 225 39 L240 44 C247 59 247 79 247 96 L237 117 L221 137 L185 142 L152 141 L126 139 L117 122 L117 89 L133 56 Z',
  'parts':{'eye-right':[140,66,190,90],'eye-left':[193,53,241,84],'ear-right':[120,93,165,126]},
  'skin':[
   [(153,49),(173,40),(198,40),(217,47),(231,65),(236,80),(230,99),(218,113),(200,126),(180,122),(160,113),(155,105),(163,96),(145,88),(149,71)],
   [(125,99),(134,96),(142,99),(148,105),(157,107),(163,113),(156,121),(143,120),(129,114),(122,106)],
  ],
 },
}

def source_poses(atlas):
    rgba=np.array(Image.open(atlas).convert('RGBA'))
    labels,_=ndimage.label(rgba[:,:,3]>128)
    counts=np.bincount(labels.ravel());objects=ndimage.find_objects(labels)
    candidates=[(i,b) for i,b in enumerate(objects,1) if b and counts[i]>4000]
    candidates=sorted(candidates,key=lambda item:counts[item[0]],reverse=True)[:6]
    if len(candidates)!=6:raise ValueError('Expected six Maya source poses')
    candidates.sort(key=lambda item:(0 if (item[1][0].start+item[1][0].stop)/2<rgba.shape[0]/2 else 1,(item[1][1].start+item[1][1].stop)/2))
    poses=[]
    for label,b in candidates:
        crop=rgba[b].copy();mask=labels[b]==label
        crop[~mask,:3]=0;crop[:,:,3]=np.where(mask,255,0)
        poses.append(Image.fromarray(crop))
    return poses

def compile_face(source,spec):
    x0,y0,x1,y1=spec['box'];image=source.crop((x0,y0,x1,y1));rgba=np.array(image)
    visible=rgba[:,:,3]>128
    indexed=image.convert('RGB').quantize(colors=96,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    labels=np.array(indexed);palette=np.array(indexed.getpalette()).reshape(-1,3)
    skin_image=Image.new('L',image.size);skin_draw=ImageDraw.Draw(skin_image)
    for polygon in spec['skin']:
        skin_draw.polygon([(x-x0,y-y0) for x,y in polygon],fill=255)
    skin=np.array(skin_image)>0
    hsv=np.array(image.convert('RGB').convert('HSV'))/255
    hue=hsv[:,:,0]*360
    # Enclose dark mouth/eye shapes using the surrounding source skin, then
    # include its anti-aliased boundary. A polygon alone leaves tiny edge
    # pixels in the hair palette when a dark or bright variant is rendered.
    skin_seed=(hue>5)&(hue<35)&(hsv[:,:,1]>.28)&(hsv[:,:,2]>.58)&visible
    enclosed=ndimage.binary_fill_holes(ndimage.binary_closing(skin_seed,iterations=2))
    skin|=ndimage.binary_dilation(enclosed,iterations=2)
    metal_seed=(hue>35)&(hue<75)&(hsv[:,:,1]>.35)&(hsv[:,:,2]>.48)&visible
    metal=ndimage.binary_dilation(metal_seed,iterations=2)
    part_names=['face-base',*spec['parts']]
    regions=np.zeros(visible.shape,dtype=np.uint8)
    for region,(part,bounds) in enumerate(spec['parts'].items(),1):
        a,b,c,d=bounds
        regions[max(0,b-y0):min(image.height,d-y0),max(0,a-x0):min(image.width,c-x0)]=region
    # Keep nearby curls in the face-base layer. Addressable eye/ear groups
    # contain facial skin and fixed ink/whites/gold, not recolorable hair.
    channels=rgba[:,:,:3]/255
    fixed_ink=channels.max(axis=2)<.24
    whites=(channels.min(axis=2)>.55)&(channels.max(axis=2)-channels.min(axis=2)<.13)
    gold=(channels[:,:,1]>channels[:,:,0]*.6)&(channels[:,:,2]<channels[:,:,1]*.7)&(channels[:,:,0]>.3)
    regions=np.where(skin|fixed_ink|whites|metal,regions,0)
    parts=[]
    for region,part in enumerate(part_names):
        paths=[]
        for color,rgb in enumerate(palette[:96]):
            selected=(labels==color)&visible&(regions==region)
            if not selected.any():continue
            h,s,v=colorsys.rgb_to_hsv(*(int(channel)/255 for channel in rgb));h*=360
            base=semantic_color('maya',rgb)
            if part!='face-base' and base=='hair':base='skin'
            # Warm ear and nose shadows must follow skin, not hair. Preserve
            # dark facial ink, eye whites, lips and gold as authored colors.
            face_semantic='skin' if 8<h<45 and s>.2 and v>.24 else base
            if part.startswith('eye-') and v<.35:base=face_semantic='fixed'
            gold=(30<h<75 and s>.25 and rgb[1]>rgb[0]*.6)
            if gold:base=face_semantic='fixed'
            semantics=[('fixed',selected&metal),(base,selected&~skin&~metal),(face_semantic,selected&skin&~metal)]
            if base==face_semantic:semantics=[('fixed',selected&metal),(base,selected&~metal)]
            for semantic,mask in semantics:
                if not mask.any():continue
                loops=trace_mask(mask,min_area=.25,tolerance=.2)
                d=' '.join('M'+' L'.join(f'{x:g} {y:g}' for x,y in loop)+'Z' for loop in loops)
                if not d:continue
                paths.append({'fill':'#'+''.join(f'{int(channel):02x}' for channel in rgb),'semantic':semantic,'d':d})
        parts.append({'name':part,'paths':paths})
    return {'box':spec['box'],'clip':spec['clip'],'featureBounds':spec['parts'],'parts':parts}

def main():
    atlas=ROOT/'art-sources/maya-poses.png';poses=source_poses(atlas)
    faces={name:compile_face(poses[spec['index']],spec) for name,spec in SPECS.items()}
    payload={'sourceHash':hashlib.sha256(atlas.read_bytes()).hexdigest(),'faces':faces}
    target=ROOT/'src/compiled-faces.mjs'
    target.write_text('/** Generated source-aligned facial geometry. Rebuild with compile_faces.py. */\nexport const MAYA_FACE_REPLACEMENTS='+json.dumps(payload,separators=(',',':'))+';\n')
    print(f'Compiled {len(faces)} complete face layers: {target.stat().st_size:,} bytes')

if __name__=='__main__':main()
