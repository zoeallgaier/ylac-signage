# Crop each source so its subject lands where the layout needs it, then size for the stage.
# Needs Pillow (pip install pillow). Run from the repo root: python3 tools/crop.py
# To add a photo: add a line to SPECS with its original file, then point a content file at assets/img/<name>.jpg.
import os
from PIL import Image, ImageOps
OUT=os.path.join(os.path.dirname(__file__),'..','assets','img')+'/'
AI='/Users/ty/Documents/UVU-Alumni Redesign/_images/'
GI='/Users/ty/Documents/UVU-Giving Redesign/_images/'
A='/Users/ty/Documents/UVU-Alumni Redesign/_cms-mockups/'
A='/Users/ty/Documents/UVU-Alumni Redesign/_cms-mockups/'
# name, source id or path, out size, focal (fx,fy) in source, where the focal lands in the output (tx,ty), zoom (1 = largest crop)
SPECS=[
 ('bleed-care-hub',       GI+'20250221_CARE Hub_KE_00172.jpg', (1440,2560), (.55,.32), (.5,.30), 1),
 ('bleed-campus',         GI+'20260414_Aerial Drone Photos Orem Campus_AM_0030.jpg', (1440,2560), (.50,.52), (.5,.42), .72),
 ('frame-awards',   A+'alumni-awards/assets/alumni-awards-honoring.jpg', (1600,1200), (.50,.50), (.5,.5), 1),  # only a web crop exists; ask UVU Photo for the original
 ('frame-alumni-tailgate',AI+'20260715_Alumni_License Plate Photoshoot_EM_00800.jpg', (1600,1200), (.50,.55), (.5,.55), 1),
 ('frame-plate',          AI+'20260715_Alumni_License Plate Photoshoot_EM_00033.jpg', (1600,1200), (.70,.50), (.5,.5), .9),
 ('detail-benefits',      AI+'20260715_Alumni_License Plate Photoshoot_EM_00743.jpg', (1600,1000), (.48,.50), (.5,.5), 1),
 ('detail-podcast',       AI+'20240417_WSB_Lifestyle Photoshoot_EM_0525.jpg',  (1600,1000), (.58,.45), (.5,.45), .9),
 ('detail-career',        AI+'20251112_Employee Lifestyle_Pt 2_0901.JPG', (1600,1000), (.60,.40), (.5,.42), 1),
 ('detail-pantry',        GI+'20250221_CARE Hub_KE_00234.jpg', (1600,1000), (.45,.40), (.5,.42), 1),
 ('detail-scholarships',  AI+'20260430_SOA Convocation_NG_0469.jpg', (1600,1000), (.50,.50), (.5,.48), .85),
 ('detail-wolverine-club',AI+'20240203_MBB vs Grand Canyon_KE_2056.jpg',  (1600,1000), (.50,.45), (.5,.45), 1),
 ('detail-library',       GI+'20240329_FL_Lifestyle Shoot_EM_1219.jpg', (1600,1000), (.62,.55), (.5,.5), .9),
 ('detail-gift-planning', GI+'20240329_FL_Lifestyle Shoot_EM_1477.jpg', (1600,1000), (.35,.40), (.45,.42), 1),
 ('detail-matching',      AI+'20251112_Employee Lifestyle_Pt 2_1321.JPG', (1600,1000), (.52,.35), (.5,.4), 1),
 ('headshot-kyrsi',       GI+'20210701_FYAC_Kyrsi Zamora_EF_0208a.jpg', (800,800),   (.50,.30), (.5,.40), 1),
]
for name,srcid,(W,H),(fx,fy),(tx,ty),z in SPECS:
    p=srcid
    im=ImageOps.exif_transpose(Image.open(p)).convert('RGB')
    sw,sh=im.size; ar=W/H
    cw,ch=(sh*ar,sh) if sw/sh>ar else (sw,sw/ar)
    cw,ch=cw*z,ch*z
    x=min(max(fx*sw-tx*cw,0),sw-cw); y=min(max(fy*sh-ty*ch,0),sh-ch)
    out=im.crop((round(x),round(y),round(x+cw),round(y+ch))).resize((W,H),Image.LANCZOS)
    out.save(OUT+name+'.jpg',quality=82,optimize=True,progressive=True)
    # where the focal point actually landed (after clamping)
    print(f'{name:24s} {W}x{H}  focal lands at ({(fx*sw-x)/cw:.2f}, {(fy*sh-y)/ch:.2f})  from {int(cw)}x{int(ch)} source px')
