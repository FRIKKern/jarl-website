from PIL import Image
import sys
sys.path.insert(0,"/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/recrop")
from gen import band, OUT
PICKS={"akerbrygge":15,"gyldendal":9,"hundesteder":14,"lunnheim":0,
       "aquatiq":35,"kronprinsparetsfond":10,"oslobukta":10,"galleryspace":14}
import os
os.makedirs(f"{OUT}/final",exist_ok=True)
for name,p in PICKS.items():
    b,meta=band(name,p)
    fin=b.resize((1440,586),Image.LANCZOS)
    fn=f"{OUT}/final/{name}-forside-kort-2026-07-31.jpg"
    fin.save(fn,quality=85,optimize=True,progressive=True)
    print(f"{name:22s} y={p:>2}%  src band {meta[0]}x{meta[1]} @y{meta[2]}  -> 1440x586  {os.path.getsize(fn)//1024} KB")
