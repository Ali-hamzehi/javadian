#!/usr/bin/env python3
import zlib
import struct
import math
import os

def render_png(width, height, is_maskable=False):
    raw = bytearray()
    
    cx, cy = width / 2.0, height / 2.0
    # Safe zone scaling:
    # For maskable, safe zone is central 80% circle (radius ~ 0.40 * width).
    # All emblem elements are drawn inside this safe zone circle when is_maskable is True.
    inner_scale = 0.72 if is_maskable else 0.92
    scale = (width / 512.0) * inner_scale
    
    for y in range(height):
        raw.append(0) # filter 0
        ny = y / float(height) # 0 to 1
        for x in range(width):
            nx = x / float(width) # 0 to 1
            
            dx = (x - cx) / scale
            dy = (y - cy) / scale
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Background gradient: from #1e1b4b (top-left) to #0f172a (middle) to #020617 (bottom-right)
            t = (nx * 0.4 + ny * 0.6)
            bg_r = int(30 * (1 - t) + 15 * t)
            bg_g = int(27 * (1 - t) + 23 * t)
            bg_b = int(75 * (1 - t) + 42 * t)
            
            # Default pixel is background
            r, g, b, a = bg_r, bg_g, bg_b, 255
            
            # Decorative ring inside safe zone
            # Radius 158 to 164
            if 158 <= dist <= 164:
                ring_alpha = 0.55
                r = int(r * (1 - ring_alpha) + 67 * ring_alpha)
                g = int(g * (1 - ring_alpha) + 56 * ring_alpha)
                b = int(b * (1 - ring_alpha) + 202 * ring_alpha)
            
            # Shield / Drop silhouette:
            # Center at cx,cy. Tip at (0, -110), base circle center at (0, 45) radius 85.
            in_droplet = False
            base_dy = dy - 40
            base_dist = math.sqrt(dx*dx + base_dy*base_dy)
            
            if base_dist <= 80:
                in_droplet = True
            elif dy < 40 and dy > -110:
                # Tangent cone from (-110, 0) to base circle
                cone_w = 80 * (dy + 110) / 150.0
                if abs(dx) <= cone_w:
                    in_droplet = True
            
            if in_droplet:
                # Indigo droplet gradient
                dt = (dy + 110) / 230.0 # 0 at top, 1 at bottom
                drop_r = int(129 * (1 - dt) + 79 * dt)
                drop_g = int(140 * (1 - dt) + 70 * dt)
                drop_b = int(248 * (1 - dt) + 229 * dt)
                
                # Drop shadow / inner glow
                edge_fade = 1.0
                if base_dist > 74:
                    edge_fade = (80 - base_dist) / 6.0
                elif dy < 40:
                    cone_w = 80 * (dy + 110) / 150.0
                    edge_dist = cone_w - abs(dx)
                    if edge_dist < 6:
                        edge_fade = max(0.0, edge_dist / 6.0)
                
                # Inner Golden core (edible oil essence)
                in_gold = False
                gold_base_dy = dy - 40
                gold_dist = math.sqrt(dx*dx + gold_base_dy*gold_base_dy)
                if gold_dist <= 50:
                    in_gold = True
                elif dy < 40 and dy > -65:
                    gold_w = 50 * (dy + 65) / 105.0
                    if abs(dx) <= gold_w:
                        in_gold = True
                
                if in_gold:
                    gt = (dy + 65) / 155.0
                    r = int(251 * (1 - gt) + 217 * gt)
                    g = int(191 * (1 - gt) + 119 * gt)
                    b = int(36 * (1 - gt) + 6 * gt)
                else:
                    r = int(r * (1 - edge_fade) + drop_r * edge_fade)
                    g = int(g * (1 - edge_fade) + drop_g * edge_fade)
                    b = int(b * (1 - edge_fade) + drop_b * edge_fade)
                
                # Stylized "ج" dot / accent inside golden core: center (0, 42)
                dot_dist = math.sqrt(dx*dx + (dy - 42)*(dy - 42))
                if dot_dist <= 16:
                    r, g, b = 30, 27, 75
                if dot_dist <= 9:
                    r, g, b = 251, 191, 36
            
            # Bottom corporate accent pill
            if 115 <= dy <= 125 and abs(dx) <= 45:
                accent_alpha = 0.85
                r = int(r * (1 - accent_alpha) + 99 * accent_alpha)
                g = int(g * (1 - accent_alpha) + 102 * accent_alpha)
                b = int(b * (1 - accent_alpha) + 241 * accent_alpha)
            
            raw.extend([min(255, max(0, r)), min(255, max(0, g)), min(255, max(0, b)), a])
            
    compressed = zlib.compress(bytes(raw), 9)
    
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
        
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    
    png_bytes = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')
    return png_bytes

def write_ico(png_32_bytes, output_filename):
    header = struct.pack('<HHH', 0, 1, 1)
    entry = struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png_32_bytes), 6 + 16)
    with open(output_filename, 'wb') as f:
        f.write(header + entry + png_32_bytes)

def main():
    os.makedirs('public', exist_ok=True)
    os.makedirs('public/icons', exist_ok=True)
    
    print("Generating PWA PNG icons...")
    # 512x512
    p512 = render_png(512, 512, is_maskable=False)
    with open('public/pwa-512x512.png', 'wb') as f:
        f.write(p512)
    with open('public/icons/icon-512.png', 'wb') as f:
        f.write(p512)
    print("✓ public/pwa-512x512.png & public/icons/icon-512.png")
    
    # 192x192
    p192 = render_png(192, 192, is_maskable=False)
    with open('public/pwa-192x192.png', 'wb') as f:
        f.write(p192)
    with open('public/icons/icon-192.png', 'wb') as f:
        f.write(p192)
    print("✓ public/pwa-192x192.png & public/icons/icon-192.png")
    
    # Maskable 512x512
    pmask512 = render_png(512, 512, is_maskable=True)
    with open('public/pwa-maskable-512x512.png', 'wb') as f:
        f.write(pmask512)
    with open('public/icons/icon-maskable-512.png', 'wb') as f:
        f.write(pmask512)
    print("✓ public/pwa-maskable-512x512.png & public/icons/icon-maskable-512.png")
    
    # Maskable 192x192
    pmask192 = render_png(192, 192, is_maskable=True)
    with open('public/pwa-maskable-192x192.png', 'wb') as f:
        f.write(pmask192)
    with open('public/icons/icon-maskable-192.png', 'wb') as f:
        f.write(pmask192)
    print("✓ public/pwa-maskable-192x192.png & public/icons/icon-maskable-192.png")
    
    # Apple Touch Icon 180x180
    p180 = render_png(180, 180, is_maskable=False)
    with open('public/apple-touch-icon.png', 'wb') as f:
        f.write(p180)
    with open('public/icons/apple-touch-icon.png', 'wb') as f:
        f.write(p180)
    print("✓ public/apple-touch-icon.png & public/icons/apple-touch-icon.png")
    
    # Favicon 32x32
    p32 = render_png(32, 32, is_maskable=False)
    with open('public/favicon-32x32.png', 'wb') as f:
        f.write(p32)
    print("✓ public/favicon-32x32.png")
    
    # Favicon ICO
    write_ico(p32, 'public/favicon.ico')
    print("✓ public/favicon.ico")

if __name__ == '__main__':
    main()
