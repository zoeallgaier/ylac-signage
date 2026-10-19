# Crops each screen's photo band (888 × 520 on the stage, saved at 2x) around its subject.
# Needs Pillow (pip install pillow). Run from the repo root: python3 tools/crop.py
# To change a screen's photo: add or edit a line in BANDS, run this, and point the content file at assets/img/<name>.jpg.
#   focal = where the subject is in the original (0–1 from left, 0–1 from top)
#   place = where it should land in the band, zoom = 1 for the largest crop, smaller to zoom in
#   box   = an exact crop (x, y, width, height as fractions) when you need to keep something out of frame
import os
from PIL import Image, ImageOps, ImageFilter, ImageEnhance

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img') + '/'
AI = '/Users/ty/Documents/UVU-Alumni Redesign/_images/'
GI = '/Users/ty/Documents/UVU-Giving Redesign/_images/'
W, H = 1776, 1040

BANDS = [
	# name           original                                                         focal        place        zoom
	('band-alumni',  AI + '20260715_Alumni_License Plate Photoshoot_EM_00800.jpg',  (.50, .55), (.5, .55), 1),
	('band-impact',  GI + '20250221_CARE Hub_KE_00172.jpg',                          (.57, .34), (.5, .38), .62),
	('band-give',    AI + '20260430_SOA Convocation_NG_0469.jpg',                    (.50, .45), (.5, .45), .85),
	# Donors: an exact box that stops above the baseball field (its Wolverine logo is an Athletics-only mark)
	('band-thanks',  GI + '20260414_Aerial Drone Photos Orem Campus_AM_0030.jpg',   'box', (.4, .13, None, .60), None),
]

for name, path, focal, place, zoom in BANDS:
	im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
	sw, sh = im.size
	ar = W / H
	if focal == 'box':
		bx, by, _, bh = place
		ch = sh * bh; cw = ch * ar; x = (sw - cw) * bx; y = sh * by
	else:
		(fx, fy), (tx, ty) = focal, place
		cw, ch = (sh * ar, sh) if sw / sh > ar else (sw, sw / ar)
		cw, ch = min(cw * zoom, sw), min(ch * zoom, sh)
		x = min(max(fx * sw - tx * cw, 0), sw - cw); y = min(max(fy * sh - ty * ch, 0), sh - ch)
	im.crop((round(x), round(y), round(x + cw), round(y + ch))).resize((W, H), Image.LANCZOS).save(OUT + name + '.jpg', quality=82, optimize=True, progressive=True)
	# the background: the same photo mirrored and pre-blurred, tiny (no live CSS blur on the players)
	bd = ImageOps.fit(ImageOps.flip(Image.open(OUT + name + '.jpg')), (270, 480), Image.LANCZOS).filter(ImageFilter.GaussianBlur(22))
	ImageEnhance.Color(bd).enhance(1.3).save(OUT + name.replace('band-', 'backdrop-') + '.jpg', quality=72, optimize=True, progressive=True)
	print('saved', name, 'and its backdrop')
