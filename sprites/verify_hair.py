"""Verify that changing Maya's hair color leaves visible neck skin unchanged."""
from pathlib import Path
from io import BytesIO
import json,re,subprocess
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
from compile_faces import source_poses

ROOT=Path(__file__).resolve().parent
NAMES=['idle','talking','angry','embarrassed','celebrate','shocked']
NECKS=[(142,148,171,174),(137,146,164,170),(184,155,217,174),(103,146,129,174),(163,131,189,158),(145,133,182,165)]
JS="""
import {PRESETS,createCharacter,renderSprite} from './src/sprites.mjs';
const cases={};
for(const reaction of ['idle','talking','angry','embarrassed','celebrate','shocked'])
  cases[reaction]=[renderSprite(PRESETS.maya,{reaction}),renderSprite(createCharacter({...PRESETS.maya,hairColor:'#e5b557'}),{reaction})];
process.stdout.write(JSON.stringify(cases));
"""

def run():
    cases=json.loads(subprocess.run(['node','--input-type=module','-e',JS],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
    library=json.loads((ROOT/'src/compiled-art.mjs').read_text().split('export const ART_LIBRARY=',1)[1].strip().rstrip(';'))
    source=source_poses(ROOT/'art-sources/maya-poses.png');checks=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':600,'height':600})
        for i,name in enumerate(NAMES):
            width=source[i].width;frame=library['maya']['frames'][i]
            ox,oy,scale=map(float,re.findall(r'[-\d.]+',frame['transform']));images=[]
            for svg in cases[name]:
                svg=svg.replace('width="512" height="512"',f'width="{width}" height="220"').replace('viewBox="0 0 512 512"',f'viewBox="{ox} {oy} {width*scale} {220*scale}"')
                page.set_content('<style>body{margin:0;background:transparent}svg{display:block}</style>'+svg)
                images.append(np.array(Image.open(BytesIO(page.locator('body > svg').screenshot(omit_background=True))).convert('RGBA')))
            x0,y0,x1,y1=NECKS[i];a=images[0][y0:y1,x0:x1];b=images[1][y0:y1,x0:x1]
            hsv=np.array(source[i].convert('RGB').convert('HSV'))[y0:y1,x0:x1].astype(float)/255
            visible=(a[:,:,3]>128)&(hsv[:,:,0]*360>5)&(hsv[:,:,0]*360<35)&(hsv[:,:,1]>.25)&(hsv[:,:,2]>.5)
            assert visible.sum()>20,(name,'reference neck area missing')
            changed=np.any(np.abs(a[:,:,:3].astype(int)-b[:,:,:3].astype(int))>2,axis=2)&visible
            assert not changed.any(),(name,'hair color on neck',int(changed.sum()))
            checks.append({'reaction':name,'visible_neck_pixels':int(visible.sum()),'hair_colored_neck_pixels':int(changed.sum())})
        browser.close()
    result={'status':'passed','neck_color_checks':checks}
    (ROOT/'review/hair-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))

if __name__=='__main__':run()
