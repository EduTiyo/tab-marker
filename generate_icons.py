import os
from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale factors based on size
    scale = size / 64.0
    
    # Draw tab shape (rounded rectangle tab)
    # Tab body
    tab_x0 = int(6 * scale)
    tab_y0 = int(14 * scale)
    tab_x1 = int(58 * scale)
    tab_y1 = int(54 * scale)
    radius = int(8 * scale)
    
    # Draw tab background (dark slate blue / modern browser tab style)
    draw.rounded_rectangle(
        [tab_x0, tab_y0, tab_x1, tab_y1],
        radius=radius,
        fill=(30, 41, 59, 255),       # slate-800
        outline=(71, 85, 105, 255),   # slate-600
        width=max(1, int(2 * scale))
    )
    
    # Draw mini simulated content lines in the tab
    line_y1 = int(32 * scale)
    line_y2 = int(42 * scale)
    draw.rounded_rectangle(
        [int(14 * scale), line_y1, int(36 * scale), line_y1 + max(1, int(3 * scale))],
        radius=int(1.5 * scale),
        fill=(148, 163, 184, 255)     # slate-400
    )
    draw.rounded_rectangle(
        [int(14 * scale), line_y2, int(28 * scale), line_y2 + max(1, int(3 * scale))],
        radius=int(1.5 * scale),
        fill=(100, 116, 139, 255)     # slate-500
    )
    
    # Draw the characteristic vibrant colored marker dot in the top-right corner
    # Badge center & radius
    dot_r = int(10 * scale)
    dot_cx = int(46 * scale)
    dot_cy = int(18 * scale)
    
    # Outer white/bright border
    border_w = max(1, int(2.5 * scale))
    draw.ellipse(
        [dot_cx - dot_r - border_w, dot_cy - dot_r - border_w,
         dot_cx + dot_r + border_w, dot_cy + dot_r + border_w],
        fill=(255, 255, 255, 255)
    )
    
    # Inner vibrant dot (Emerald green / Coral red gradient feel, let's use a vivid blue-violet or cyan/emerald)
    draw.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r,
         dot_cx + dot_r, dot_cy + dot_r],
        fill=(239, 68, 68, 255) # Red #ef4444
    )
    
    # Tiny highlight reflection on dot
    refl_r = max(1, int(2.5 * scale))
    draw.ellipse(
        [dot_cx - int(4 * scale) - refl_r, dot_cy - int(4 * scale) - refl_r,
         dot_cx - int(4 * scale) + refl_r, dot_cy - int(4 * scale) + refl_r],
        fill=(255, 255, 255, 200)
    )
    
    return img

os.makedirs('/Users/eduardotiyo/Documents/tab-marker/icons', exist_ok=True)
for s in [16, 32, 48, 128]:
    icon = create_icon(s)
    icon.save(f'/Users/eduardotiyo/Documents/tab-marker/icons/icon-{s}.png')
    print(f"Generated icon-{s}.png")
