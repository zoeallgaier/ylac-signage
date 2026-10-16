# Worst-case WCAG contrast of white text over (photo + UVU Green fade), sampled under the real text block.
# Needs Pillow. Run from the repo root: python3 tools/contrast.py
# Checks white text over each full-bleed photo + the CSS fade (TUNED matches css/signage.css).
import os, glob
from PIL import Image
D=os.path.join(os.path.dirname(__file__),'..','assets','img')+'/'
G=(24,92,51)
def lin(c): c/=255; return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def L(rgb): r,g,b=rgb; return .2126*lin(r)+.7152*lin(g)+.0722*lin(b)
def alpha(y,stops):  # stops: (fraction from bottom, alpha), like the CSS gradient at 0deg
    b=(1920-y)/1920
    for (b0,a0),(b1,a1) in zip(stops,stops[1:]):
        if b0<=b<=b1: return a0+(a1-a0)*(b-b0)/(b1-b0)
    return stops[-1][1] if b>stops[-1][0] else stops[0][1]
def worst(img,stops,top=840,bottom=1260):
    im=Image.open(D+img).convert('RGB').resize((1080,1920))
    px=im.load(); lums=[]
    for y in range(top,bottom,4):
        a=alpha(y,stops)
        for x in range(80,1000,4):
            p=px[x,y]; c=tuple(a*G[i]+(1-a)*p[i] for i in range(3)); lums.append(L(c))
    lums.sort(); hi=lums[int(len(lums)*.99)]; mx=lums[-1]
    return 1.05/(hi+.05), 1.05/(mx+.05)
OLD=[(0,1),(.30,1),(.46,.82),(.66,0)]
NEW=[(0,1),(.30,1),(.58,.9),(.80,0)]
for img in [os.path.basename(f) for f in glob.glob(D+'bleed-*.jpg')]:
    o=worst(img,OLD); n=worst(img,NEW)
    print(f'{img:20s} current fade: {o[0]:.2f}:1 (99th pct) / {o[1]:.2f}:1 (single brightest pixel)   stronger fade: {n[0]:.2f}:1 / {n[1]:.2f}:1')
TUNED=[(0,1),(.30,1),(.565,.93),(.74,0)]
print('tuned fade:')
for img in [os.path.basename(f) for f in glob.glob(D+'bleed-*.jpg')]:
    n=worst(img,TUNED); print(f'  {img:20s} {n[0]:.2f}:1 (99th pct) / {n[1]:.2f}:1 (brightest pixel)')
for y,label in [(576,'care-hub face (y 576)'),(700,'campus skyline (y 700)')]:
    print(f'  overlay at {label}: tuned {alpha(y,TUNED):.2f}, current {alpha(y,OLD):.2f}')
