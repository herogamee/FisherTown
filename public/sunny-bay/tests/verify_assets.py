from PIL import Image
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree
root=Path(__file__).resolve().parents[1]
paths=[root/'assets'/'sunny-bay-clean.webp',root/'game.js',root/'scene.js',root/'style.css',root/'index.html']
for p in paths: assert p.exists(),p
clean=Image.open(root/'assets'/'sunny-bay-clean.webp')
assert clean.width>=1024 and clean.height>=1100
assets=list((root/'assets'/'live-fish').glob('*.webp'))
assert len(assets)==5,len(assets)
for a in assets:
 im=Image.open(a)
 assert im.mode in ('RGBA','RGB'),a
 assert 'A' in im.getbands(),a
assert not (root/'assets'/'sunny-bay-scene.webp').exists(), 'old baked fish/rod scenic art is still shipped'
html=(root/'index.html').read_text(encoding='utf-8')
for v in ('id="sea-canvas"','id="rod-canvas"','./scene.js'):
 assert v in (html+(root/'game.js').read_text()),v
js=(root/'scene.js').read_text(encoding='utf-8')
assert 'this.fish.map' in js and 'this.drawRod(' in js
print('PASS: clean marine scenery, five alpha fish sprites, independent fish and rod canvases')
