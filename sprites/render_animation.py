from pathlib import Path
import os
import shutil
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
with sync_playwright() as p:
    executable=os.environ.get('SPRITE_CHROME') or shutil.which('chromium')
    kwargs={'headless':True,'args':['--no-sandbox']}
    if executable:kwargs['executable_path']=executable
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':960,'height':540})
    frames=[]
    for source in sorted((ROOT/'review'/'animation-frames').glob('*.svg')):
        page.set_content('<style>body{margin:0}svg{display:block}</style>'+source.read_text())
        png=source.with_suffix('.png')
        page.locator('body > svg').screenshot(path=png)
        frames.append(Image.open(png).convert('RGB').quantize(colors=192))
    browser.close()
    frames[0].save(ROOT/'review'/'acting-preview.gif',save_all=True,append_images=frames[1:],duration=180,loop=0,optimize=False,disposal=2)
    print(f'{len(frames)} frames → review/acting-preview.gif')
