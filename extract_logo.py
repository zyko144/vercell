import numpy as np
from PIL import Image

def process_logo():
    # Load original image
    src_path = r"C:\Users\noamb\.gemini\antigravity\brain\6b300985-d422-4000-a213-2e5f32f5ddeb\ocean_wave_logo_1787945116925.jpg"
    img = Image.open(src_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)

    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    # In the original image:
    # The logo glyph is pure white (R ~ 255, G ~ 255, B ~ 255).
    # The background is a blue-cyan gradient (R is significantly lower than B and G, e.g. R < 100, B > 180).
    # White has high minimum value min(R, G, B) and low color saturation.
    
    # Let's compute whiteness metric
    # Whiteness: how close is R, G, B to (255, 255, 255) vs the cyan background
    min_rgb = np.minimum(np.minimum(r, g), b)
    max_rgb = np.maximum(np.maximum(r, g), b)
    saturation = (max_rgb - min_rgb) / (max_rgb + 1e-5)
    
    # Smooth alpha mask: high min_rgb and low saturation
    # Thresholds: background has saturation > 0.4 and min_rgb < 180
    # Glyph has min_rgb > 200 and saturation < 0.15
    alpha = np.clip((min_rgb - 160.0) / (240.0 - 160.0), 0.0, 1.0)
    # Further suppress background where saturation is high
    sat_factor = np.clip(1.0 - (saturation - 0.1) / (0.4 - 0.1), 0.0, 1.0)
    final_alpha = (alpha * sat_factor * 255.0).astype(np.uint8)

    # Now create the gradient for the glyph
    # Light blue / cyan (#00e5ff / #38bdf8) at top to vibrant ocean blue (#0284c7 / #2563eb) at bottom
    height, width = data.shape[:2]
    gradient = np.zeros((height, width, 3), dtype=np.float32)
    
    # Top color: Cyan / Light Sky Blue: RGB(56, 189, 248) -> (0, 210, 255)
    # Bottom color: Electric Ocean Blue: RGB(14, 116, 233) -> (20, 90, 235)
    c_top = np.array([0, 220, 255], dtype=np.float32)      # vibrant light cyan
    c_bottom = np.array([20, 100, 245], dtype=np.float32)   # vibrant ocean blue

    for y in range(height):
        t = y / (height - 1)
        gradient[y, :, :] = (1.0 - t) * c_top + t * c_bottom

    # Combine gradient color + final_alpha
    out_arr = np.zeros((height, width, 4), dtype=np.uint8)
    out_arr[:,:,0:3] = np.clip(gradient, 0, 255).astype(np.uint8)
    out_arr[:,:,3] = final_alpha

    out_img = Image.fromarray(out_arr, mode="RGBA")
    
    # Crop tightly with small padding around the logo
    bbox = out_img.getbbox()
    if bbox:
        cropped = out_img.crop(bbox)
        # Pad to make it square
        w, h = cropped.size
        size = max(w, h) + 40
        square_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        square_img.paste(cropped, ((size - w) // 2, (size - h) // 2))
        
        # Save high-res versions
        out_path_app = r"C:\Users\noamb\Documents\quality\src\assets\quality_logo.png"
        out_path_public = r"C:\Users\noamb\Documents\quality\public\quality_logo.png"
        out_path_site = r"C:\Users\noamb\.gemini\antigravity\scratch\portfolio-vercel\quality_glyph_transparent.png"
        
        import os
        os.makedirs(os.path.dirname(out_path_app), exist_ok=True)
        os.makedirs(os.path.dirname(out_path_public), exist_ok=True)
        
        square_img.save(out_path_app, "PNG")
        square_img.save(out_path_public, "PNG")
        square_img.save(out_path_site, "PNG")
        print("Success! Dimensions:", square_img.size)

if __name__ == "__main__":
    process_logo()
