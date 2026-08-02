from PIL import Image, ImageDraw
import sys, os
SRC="/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/media"
OUT="/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/recrop"
AR=640/260.0
CARD=(339,138)

SOURCES={
 "akerbrygge":(f"{SRC}/sites/akerbrygge.png",None),
 "gyldendal":(f"{SRC}/sites/gyldendal.png",None),
 "hundesteder":(f"{SRC}/sites/hundesteder.png",None),
 "lunnheim":(f"{SRC}/sites/lunnheim.png",None),
 "aquatiq":(f"{SRC}/sites/aquatiq.png",None),
 "kronprinsparetsfond":(f"{SRC}/sites/kronprinsparetsfond.png",None),
 "oslobukta":(f"{SRC}/sites/oslobukta.png",None),
 # galleryspace: crop x from 380/1440 to 1.0 to drop broken-image card
 "galleryspace":(f"{SRC}/galleryspace-home.png",(380/1440.0,1.0)),
}

def band(name, ypct):
    path,xr = SOURCES[name]
    im=Image.open(path).convert("RGB")
    W,H=im.size
    if xr:
        x0=int(W*xr[0]); x1=int(W*xr[1]); im=im.crop((x0,0,x1,H)); W=x1-x0
    bh=int(round(W/AR))
    y0=int(round(H*ypct/100.0))
    y0=max(0,min(y0,H-bh))
    return im.crop((0,y0,W,y0+bh)), (W,bh,y0,H)

def sheet(name, cands):
    tiles=[]
    for p in cands:
        b,meta=band(name,p)
        card=b.resize(CARD,Image.LANCZOS)
        big=card.resize((CARD[0]*3,CARD[1]*3),Image.LANCZOS)
        wide=b.resize((1017,int(1017/AR)),Image.LANCZOS)
        tiles.append((p,meta,big,wide))
    Wt=1017*2+30
    Ht=sum(max(t[2].size[1],t[3].size[1])+26 for t in tiles)+10
    sh=Image.new("RGB",(Wt,Ht),(24,24,28)); d=ImageDraw.Draw(sh); y=6
    for p,meta,big,wide in tiles:
        d.text((6,y),f"{name}  y={p}%  band {meta[0]}x{meta[1]} @ y{meta[2]} of {meta[3]}   LEFT: card-size 339x138 (x3)   RIGHT: full band",fill=(255,220,120))
        y+=18
        sh.paste(big,(6,y)); sh.paste(wide,(1017+24,y))
        y+=max(big.size[1],wide.size[1])+8
    out=f"{OUT}/sheet-{name}.jpg"; sh.save(out,quality=82); print(out, sh.size)

if __name__=="__main__":
    import json
    plan=json.loads(sys.argv[1])
    for k,v in plan.items(): sheet(k,v)
