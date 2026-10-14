"""Rasterize the demo exports and smoke-check the standalone studio.

Optional development helper: requires Python, Pillow, Playwright and Chromium.
The generator and standalone studio do not require these packages.
"""
from pathlib import Path
import json
import os
import shutil
import xml.etree.ElementTree as ET
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent

def run():
    svgs = sorted((ROOT / 'exports').rglob('*.svg'))
    sheets = sorted((ROOT / 'review').glob('*.svg'))
    for source in svgs + sheets:
        ET.parse(source)
    errors = []
    with sync_playwright() as p:
        executable = os.environ.get('SPRITE_CHROME') or shutil.which('chromium') or shutil.which('google-chrome')
        launch = {'headless': True, 'args': ['--no-sandbox']}
        if executable:
            launch['executable_path'] = executable
        browser = p.chromium.launch(**launch)
        page = browser.new_page(viewport={'width': 1440, 'height': 1080}, device_scale_factor=1)
        page.on('pageerror', lambda error: errors.append(str(error)))
        # The managed Chromium policy blocks file: navigation. The studio is
        # self-contained, so rendering its exact HTML avoids needing a server.
        page.set_content((ROOT / 'studio.html').read_text(), wait_until='load')
        page.wait_for_selector('#sprite svg')
        assert page.locator('#sprite svg').count() == 1
        assert page.locator('.variant').count() == 24
        assert page.locator('#sprite svg').get_attribute('data-character') == 'mothmanager'
        # Small facial features are authored separately so neither tracing nor
        # palette edits can drop them. Check every human's closed-mouth states
        # and Maya's full acting set in the built offline runtime.
        for name in ['john','maya','brad']:
            page.select_option('#preset',name)
            for reaction in ['idle','embarrassed']:
                page.select_option('#reaction',reaction)
                assert page.locator('#sprite [data-part="mouth"]').count()==1
        page.select_option('#preset','maya')
        for reaction in ['idle','talking','angry','embarrassed','celebrate','shocked']:
            page.select_option('#reaction',reaction)
            assert page.locator('#sprite [data-part="eye-right"]').count()==1
            assert page.locator('#sprite [data-part="eye-left"]').count()==1
            assert page.locator('#sprite [data-part="ear-right"]').count()==1
        page.select_option('#preset', 'john')
        identity = page.locator('#sprite svg').get_attribute('data-character')
        page.get_by_role('button', name='shocked pose', exact=True).click()
        assert page.locator('#sprite svg').get_attribute('data-character') == identity
        assert 'shocked' in page.locator('#sprite title').text_content()
        assert page.locator('#sprite svg').get_attribute('data-frame') == 'shocked'
        page.get_by_role('button', name='HUMAN SINNER', exact=True).click()
        page.fill('#count', '12')
        page.get_by_role('button', name='Generate roster', exact=True).click()
        assert page.locator('.variant').count() == 12
        page.get_by_role('button', name='Select variant 3', exact=True).click()
        assert page.locator('#sprite svg').get_attribute('data-character').startswith('human-')
        page.locator('details').evaluate('(e) => e.open = true')
        page.fill('#definition', '{"species":"dragon"}')
        page.get_by_role('button', name='Apply JSON', exact=True).click()
        assert 'species must be one of' in page.locator('#status').text_content()
        page.locator('details').evaluate('(e) => e.open = false')
        page.select_option('#preset', 'mothmanager')
        with page.expect_download() as event:
            page.get_by_role('button', name='Save transparent PNG', exact=True).click()
        event.value.save_as(ROOT / 'review' / 'studio-download.png')
        with page.expect_download() as event:
            page.get_by_role('button', name='Save SVG', exact=True).click()
        event.value.save_as(ROOT / 'review' / 'studio-download.svg')
        ET.parse(ROOT / 'review' / 'studio-download.svg')
        page.get_by_role('button', name='DEMON CLERK', exact=True).click()
        page.select_option('#reaction','writing')
        page.select_option('#scene','committee')
        assert page.locator('#sprite > svg').get_attribute('data-scene') == 'committee'
        assert page.locator('#sprite svg[data-frame="writing"]').count() >= 1
        page.get_by_role('button',name='Play motion',exact=True).click()
        page.wait_for_function("document.querySelector('#sprite svg[data-time]')?.dataset.time > 0.15")
        page.get_by_role('button',name='Pause motion',exact=True).click()
        page.select_option('#scene','lineup')
        page.select_option('#reaction','idle')
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=ROOT / 'review' / 'studio-preview.png')
        for source in svgs + sheets:
            svg = source.read_text()
            page.set_content('<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>' + svg)
            target = source.with_suffix('.png')
            page.locator('body > svg').screenshot(path=target, omit_background=True)
            if source in svgs:
                image = Image.open(target).convert('RGBA')
                assert image.size == (512, 512), source
                assert image.getpixel((0, 0))[3] == 0, source
                bounds = image.getchannel('A').getbbox()
                assert bounds and min(bounds[:2]) > 0 and max(bounds[2:]) < 512, (source, bounds)
        browser.close()
    assert not errors, errors
    downloaded = Image.open(ROOT / 'review' / 'studio-download.png').convert('RGBA')
    assert downloaded.getpixel((0, 0))[3] == 0
    result = {
        'svg_files_parsed': len(svgs) + len(sheets), 'transparent_pngs': len(svgs),
        'review_sheets': len(sheets), 'studio': 'passed', 'browser_errors': errors,
        'identity_pose_check': 'passed', 'batch_controls': 'passed', 'png_download': 'passed',
        'human_closed_mouth_browser_states_checked': 6, 'maya_face_browser_states_checked': 6,
    }
    (ROOT / 'review' / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))

if __name__ == '__main__':
    run()
