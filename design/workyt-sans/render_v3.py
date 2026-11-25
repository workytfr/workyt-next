import sys
from PIL import Image, ImageDraw, ImageFont
style=sys.argv[1] if len(sys.argv)>1 else "Bold"
img=Image.new("RGB",(2000,1250),(250,246,238)); d=ImageDraw.Draw(img)
f=ImageFont.truetype(f"out/v3/WorkytSans-{style}.ttf",120)
for i,l in enumerate(["abcdefghijklm","nopqrstuvwxyz","ABCDEFGHIJKLM","NOPQRSTUVWXYZ","0123456789 ?!.,;:","workyt Révise œ «»"]):
    d.text((20,10+i*205),l,font=f,fill=(26,21,18))
img.save(f"out/v3/sheet-{style}.png")
