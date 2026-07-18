import os
from PIL import Image

def crop_icons():
    img = Image.open('stagei.png')
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        
    width, height = img.size
    
    # We expand the crop radius to 250px (full diameter of 500px)
    # to preserve the user's beautiful golden circular border itself.
    # We will let the custom image itself act as the circular node on the map!
    stage_mapping = {
        "stage1": (400, 400, 250),       # (Center X, Center Y, Full Radius)
        "stage2": (1200, 400, 250),
        "stage3": (2000, 400, 250),
        "stage4": (2800, 400, 250),
        "stage6": (800, 1400, 250),      # Abraham
        "stage5": (1600, 1400, 250),     # Babel
        "stage7": (2400, 1400, 250),      # Jacob
    }
    
    for stage_name, (cx, cy, r) in stage_mapping.items():
        box = (cx - r, cy - r, cx + r, cy + r)
        cropped_img = img.crop(box)
        
        # Resize to standard 250x250 format
        cropped_img = cropped_img.resize((250, 250), Image.Resampling.LANCZOS)
        out_name = f"{stage_name}_icon.png"
        cropped_img.save(out_name, "PNG")
        print(f"Saved full-framed icon: {out_name} with box {box}")

if __name__ == '__main__':
    crop_icons()
