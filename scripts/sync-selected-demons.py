"""Copy the three selected six-pose vector sets and render their display caches."""
from pathlib import Path
import json
import shutil
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
SPRITES=ROOT/'sprites'
IDS=['gus','norm','dot']
POSES=['idle','writing','stamping','voting','celebrate','shocked']

def main():
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':512,'height':512},device_scale_factor=1)
        page.on('pageerror',lambda error:errors.append(str(error)))
        for identity in IDS:
            for pose in POSES:
                name=f'{identity}-{pose}'
                source=SPRITES/'exports/illustrated'/f'{name}.svg'
                assert source.is_file(),source
                shutil.copyfile(source,ROOT/'public/art'/source.name)
                page.set_content('<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>'+source.read_text()+'</body></html>')
                png=source.with_suffix('.png')
                page.locator('svg').screenshot(path=str(png),omit_background=True)
                Image.open(png).save(ROOT/'public/art'/f'{name}.webp',quality=95,method=6)
                print(name,flush=True)
        browser.close()
    assert not errors,errors
    print('Eighteen selected-character poses synced from code-rendered vectors.')

if __name__=='__main__':main()
