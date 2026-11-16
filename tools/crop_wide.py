# Crops the 4K alumni screen's timeline photos (1788 x 1120 on the stage, saved 1:1).
# Needs Pillow. Run from the repo root: python3 tools/crop_wide.py "/path/to/YLAC Screen/Timeline/links"
#   focal = where the subject is in the original (0–1 from left, 0–1 from top)
#   path  = may use * for odd characters (macOS screenshot names contain a narrow space)
#   box   = the usable part of the original (left, top, right, bottom as fractions), for scans with borders or captions
import glob, os, sys
from PIL import Image, ImageOps

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img', 'timeline') + '/'
W, H = 1788, 1120

PHOTOS = [
	# name                 original                                                   focal         box
	('1941-cuvs',          'Shop_1942_CUVS_1 (1).jpg',                                (.45, .40), None),
	('1946-career',        'Typing_1966_UTTI_1.jpg',                                  (.50, .45), None),
	('1967-willy',         'MVinsonMiner_WillyTheWolverine-expanded.jpg',             (.50, .50), None),
	('1968-rodeo',         'Rodeo_Undated_UTC_1.jpg',                                 (.55, .50), None),
	('1977-orem',          '3UTC_Campus_Orem1_1977.jpg',                              (.50, .50), None),
	('1987-uvcc',          '3UTC_OremCampus_1980.jpg',                                (.50, .50), (.035, .04, .965, .90)),
	('1993-uvsc',          'McKay_Events_Center_(2404015904).jpg',                    (.50, .45), None),
	('1995-wasatch',       '20141020_Wasatch Campus-Fall Leaves_0069.JPG',            (.50, .50), None),
	('2008-uvu',           '20200324_UR_Campus Stock_GM__0272.JPG',                   (.45, .50), None),
	('2008-library',       'fulton-library.jpg',                                      (.50, .50), None),
	('2008-capitol-reef',  '20190824_ED_UVUF Retreat_JD_1669.JPG',                    (.50, .50), None),
	('2010-green-man',     '20140825_Freshman Convocation_0964.JPG',                  (.50, .40), None),
	('2015-mash',          '20151001_ROTC Squad Attack_0590.JPG',                     (.40, .45), None),
	('2018-tuminez',       '20240928_IA_Scholarship Ball_JED_2264-Enhanced-NR 1.jpg', (.60, .55), None),
	('2019-noorda',        '20230505_Campus Scenery_EM_0437.JPG',                     (.50, .55), None),
	('2021-bridge',        '202101014_FAC_Pedestrian Bridge Ribbon Cutting_GM_0220.JPG', (.50, .50), None),
	('2024-lehi',          'Screenshot 2025-08-20 at 1.44.33*PM.png',                 (.50, .50), (0, .085, 1, .895)),
	('photos-submit',      '20250430_Commencement Ceremonies_AM_0577.jpg',            (.50, .40), None),
]

for name, path, (fx, fy), box in PHOTOS:
	im = ImageOps.exif_transpose(Image.open(glob.glob(os.path.join(SRC, path))[0])).convert('RGB')
	if box:
		sw, sh = im.size
		im = im.crop((round(box[0] * sw), round(box[1] * sh), round(box[2] * sw), round(box[3] * sh)))
	sw, sh = im.size
	ar = W / H
	cw, ch = (sh * ar, sh) if sw / sh > ar else (sw, sw / ar)
	x = min(max(fx * sw - cw / 2, 0), sw - cw); y = min(max(fy * sh - ch / 2, 0), sh - ch)
	out = im.crop((round(x), round(y), round(x + cw), round(y + ch)))
	out = out.resize((W, H), Image.LANCZOS)
	out.save(OUT + name + '.jpg', quality=84, optimize=True, progressive=True)
	print('saved', name, f'(source {sw}×{sh}{", upscaled" if cw < W else ""})')
