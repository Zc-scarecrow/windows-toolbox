"""Long screenshot (scrolling capture) stitching handler."""
import os

import cv2
import numpy as np


class LongScreenshotConverter:
    """Stitch vertically scrolling screenshots into one long image."""

    def __init__(self, max_overlap_ratio=0.5, search_step=1, blend_rows=10):
        """
        Args:
            max_overlap_ratio: max fraction of image height to use as overlap search region.
            search_step: pixel step when searching overlap (1 = pixel-accurate).
            blend_rows: number of rows to linear-blend in the overlap boundary.
        """
        self.max_overlap_ratio = max_overlap_ratio
        self.search_step = max(1, search_step)
        self.blend_rows = max(0, blend_rows)

    def stitch(self, image_paths, output_path):
        if len(image_paths) < 2:
            raise ValueError("Need at least 2 images to stitch")

        images = [self._load_image(p) for p in image_paths]

        # Normalize width to the narrowest image to avoid alignment issues
        min_width = min(img.shape[1] for img in images)
        if any(img.shape[1] != min_width for img in images):
            images = [cv2.resize(img, (min_width, img.shape[0])) for img in images]

        stitched = images[0]
        for next_img in images[1:]:
            stitched = self._stitch_pair(stitched, next_img)

        os.makedirs(os.path.dirname(os.path.abspath(output_path)) or '.', exist_ok=True)
        cv2.imwrite(output_path, stitched)

    def _load_image(self, path):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Image not found: {path}")
        img = cv2.imread(path, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"Failed to load image: {path}")
        return img

    def _stitch_pair(self, prev, nxt):
        """Stitch two vertically scrolling screenshots."""
        h1, w1 = prev.shape[:2]
        h2, w2 = nxt.shape[:2]
        assert w1 == w2, "Images must have same width"

        max_overlap = min(int(h1 * self.max_overlap_ratio), int(h2 * self.max_overlap_ratio), h2 - 1)
        if max_overlap < 10:
            # No meaningful overlap, just concatenate
            return np.vstack([prev, nxt])

        # Search region: bottom of prev vs top of next
        prev_region = prev[-max_overlap:]
        next_region = nxt[:max_overlap]

        # Convert to grayscale for faster matching
        prev_gray = cv2.cvtColor(prev_region, cv2.COLOR_BGR2GRAY)
        next_gray = cv2.cvtColor(next_region, cv2.COLOR_BGR2GRAY)

        # Use template matching to find where prev bottom matches next top
        # Template is the bottom part of prev; we slide it over next_region from top to bottom
        best_offset = 0
        best_score = float('inf')

        # Try multiple template heights; smaller templates are more robust to partial matches
        template_heights = [max_overlap, max_overlap // 2, max_overlap // 4]
        template_heights = [h for h in template_heights if h >= 20]

        for tmpl_h in template_heights:
            template = prev_gray[-tmpl_h:]
            th, tw = template.shape

            for y in range(0, next_region.shape[0] - th + 1, self.search_step):
                roi = next_gray[y:y + th, :]
                # Normalized squared difference is robust to brightness changes
                diff = cv2.matchTemplate(roi, template, cv2.TM_SQDIFF_NORMED)
                score = diff[0, 0]
                if score < best_score:
                    best_score = score
                    best_offset = y + th

        # best_offset is the row in next_region where overlap ends
        # => overlap height is best_offset
        overlap_h = best_offset

        # Safety clamp
        overlap_h = max(0, min(overlap_h, h1, h2))

        # Build result: prev without its bottom overlap + blended overlap + next without its top overlap
        prev_part = prev[:h1 - overlap_h]
        next_part = nxt[overlap_h:]

        if overlap_h > 0 and self.blend_rows > 0 and overlap_h >= self.blend_rows:
            # Extract overlap regions
            prev_overlap = prev[h1 - overlap_h:h1]
            next_overlap = nxt[:overlap_h]

            # Blend the last `blend_rows` rows of overlap using linear weights
            blended_overlap = prev_overlap.copy().astype(np.float32)
            blend_start = overlap_h - self.blend_rows
            for i in range(self.blend_rows):
                alpha = i / (self.blend_rows - 1) if self.blend_rows > 1 else 1.0
                row = blend_start + i
                blended_overlap[row] = (
                    (1 - alpha) * prev_overlap[row].astype(np.float32) +
                    alpha * next_overlap[row].astype(np.float32)
                )
            result = np.vstack([prev_part, blended_overlap.astype(np.uint8), next_part])
        else:
            # No blending; just use previous image's overlap content (more conservative)
            overlap_content = prev[h1 - overlap_h:h1] if overlap_h > 0 else np.empty((0, w1, 3), dtype=np.uint8)
            result = np.vstack([prev_part, overlap_content, next_part])

        return result
