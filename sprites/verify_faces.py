"""Render the repaired faces and verify feature placement against their source.

This compares visible ink geometry, not just SVG attributes. It catches a
misplaced closed eye, stray ink left under an overlay, and hair-colored skin.
"""
from pathlib import Path
from io import BytesIO
import json
import re
import subprocess
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
from compile_faces import SPECS, source_poses

ROOT=Path(__file__).resolve().parent
# The broader addressable eye layers include nearby curls. Compare the actual
# lid/pupil area so changing the hairstyle cannot skew the eye-placement metric.
EYE_CORES={
    'angry':{'eye-right':[171,98,209,119],'eye-left':[217,91,245,113]},
    'celebrate':{'eye-right':[147,72,188,86],'eye-left':[199,60,238,79]},
}
JS="""
import {PRESETS,createCharacter,renderSprite} from './src/sprites.mjs';
const cases={};
for(const reaction of ['angry','celebrate']) {
  cases[reaction]={};
  for(const [name,patch] of Object.entries({native:{},hair:{hairColor:'#ffd760'},dark:{skin:'#533527',hairColor:'#ffd760'}}))
    cases[reaction][name]=renderSprite(createCharacter({...PRESETS.maya,...patch}),{reaction});
}
process.stdout.write(JSON.stringify(cases));
"""

def run():
    cases=json.loads(subprocess.run(['node','--input-type=module','-e',JS],cwd=ROOT,text=True,capture_output=True,check=True).stdout)
    poses=source_poses(ROOT/'art-sources/maya-poses.png')
    library=json.loads((ROOT/'src/compiled-art.mjs').read_text().split('export const ART_LIBRARY=',1)[1].strip().rstrip(';'))
    checks=[]
    folder=ROOT/'review/face-repair';folder.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':512,'height':512})
        for reaction,spec in SPECS.items():
            x0,y0,x1,y1=spec['box'];width=x1-x0;height=y1-y0
            source=poses[spec['index']].crop(spec['box']).convert('RGBA')
            expected=np.array(source);source.save(folder/f'{reaction}-reference.png')
            frame=library['maya']['frames'][spec['index']]
            ox,oy,scale=map(float,re.findall(r'[-\d.]+',frame['transform']))
            rendered={}
            for name,svg in cases[reaction].items():
                svg=svg.replace('width="512" height="512"',f'width="{width}" height="{height}"').replace('viewBox="0 0 512 512"',f'viewBox="{ox+x0*scale} {oy+y0*scale} {width*scale} {height*scale}"')
                page.set_content('<style>body{margin:0;background:transparent}svg{display:block}</style>'+svg)
                png=page.locator('body > svg').screenshot(omit_background=True)
                (folder/f'{reaction}-{name}.png').write_bytes(png)
                rendered[name]=np.array(Image.open(BytesIO(png)).convert('RGBA'))
            for part,bounds in EYE_CORES[reaction].items():
                a,b,c,d=bounds;region=np.s_[b-y0:d-y0,a-x0:c-x0]
                original=expected[region];actual=rendered['native'][region]
                # Compare the dark lash/pupil ink, excluding the warm brown
                # eyelid shading and its softer anti-aliased boundary.
                original_ink=(original[:,:,:3].max(axis=2)<48)&(original[:,:,3]>128)
                actual_ink=(actual[:,:,:3].max(axis=2)<48)&(actual[:,:,3]>128)
                intersection=(original_ink&actual_ink).sum();union=(original_ink|actual_ink).sum()
                iou=float(intersection/union)
                expected_center=np.array(np.where(original_ink)).mean(axis=1)
                actual_center=np.array(np.where(actual_ink)).mean(axis=1)
                offset=float(np.linalg.norm(actual_center-expected_center))
                assert iou>.8,(reaction,part,'ink overlap',iou)
                assert offset<.7,(reaction,part,'placement offset',offset)
                checks.append({'reaction':reaction,'part':part,'source_ink_overlap':round(iou,3),'offset_source_pixels':round(offset,3)})
            # Strong source skin pixels include the face and ear. Changing
            # hair to a very bright hue must not introduce green there.
            rgb=expected[:,:,:3].astype(float)/255
            hsv=np.array(source.convert('RGB').convert('HSV')).astype(float)/255
            skin=(hsv[:,:,0]*360>5)&(hsv[:,:,0]*360<35)&(hsv[:,:,1]>.28)&(hsv[:,:,2]>.58)&(expected[:,:,3]>128)
            for name in ['hair','dark']:
                image=rendered[name][:,:,:3].astype(float)
                # Exclude pixels outside the replacement boundary, such as
                # the neighboring clothing/hair visible in the review crop.
                # Facial features and the surrounding central cheek remain.
                core=np.zeros(skin.shape,dtype=bool)
                if reaction=='angry':core[30:105,48:122]=True
                else:core[20:105,50:122]=True
                invalid=skin&core&(image[:,:,1]>image[:,:,0]+18)
                assert not invalid.any(),(reaction,name,'hair-colored face pixels',int(invalid.sum()))
        browser.close()
    result={'status':'passed','eye_geometry':checks,'bright_hair_skin_check':'passed'}
    (ROOT/'review/face-verification.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))

if __name__=='__main__':run()
