"""Test long screenshot stitching on the three provided images."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from converters.long_screenshot_converter import LongScreenshotConverter

IMAGE_PATHS = [
    r"C:\Users\Administrator\AppData\Roaming\Qoder\SharedClientCache\cache\images\07b1b4fb\zpamsxjf-9e890bd4.png",
    r"C:\Users\Administrator\AppData\Roaming\Qoder\SharedClientCache\cache\images\07b1b4fb\eolbyoap-95f13111.png",
    r"C:\Users\Administrator\AppData\Roaming\Qoder\SharedClientCache\cache\images\07b1b4fb\m8vgb3q1-f1a2603f.png",
]

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "test_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "long_screenshot_result.png")

def main():
    for p in IMAGE_PATHS:
        if not os.path.exists(p):
            print(f"Missing: {p}")
            sys.exit(1)
        print(f"Input: {p} ({os.path.getsize(p)} bytes)")

    converter = LongScreenshotConverter(max_overlap_ratio=0.5, search_step=1, blend_rows=15)
    converter.stitch(IMAGE_PATHS, OUTPUT_PATH)

    print(f"\nOutput: {OUTPUT_PATH}")
    print(f"Size: {os.path.getsize(OUTPUT_PATH)} bytes")

    import cv2
    img = cv2.imread(OUTPUT_PATH)
    print(f"Dimensions: {img.shape[1]} x {img.shape[0]}")

if __name__ == "__main__":
    main()
