"""PDF Toolkit: merge, split, rotate, watermark, extract images.

All operations use PyMuPDF (fitz) which is already in requirements.txt.
"""
import os
import math
import json


class PdfToolkit:
    """Perform common PDF manipulation tasks."""

    def get_info(self, input_path):
        """Return basic PDF metadata and page count."""
        import fitz
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"PDF not found: {input_path}")
        doc = fitz.open(input_path)
        try:
            meta = doc.metadata or {}
            info = {
                "page_count": len(doc),
                "title": meta.get("title", ""),
                "author": meta.get("author", ""),
                "subject": meta.get("subject", ""),
                "creator": meta.get("creator", ""),
                "file_size": os.path.getsize(input_path),
                "is_encrypted": doc.is_encrypted,
            }
            return info
        finally:
            doc.close()

    def merge(self, input_paths, output_path):
        """Merge multiple PDF files into a single PDF."""
        import fitz
        if not input_paths:
            raise ValueError("No PDF files to merge")
        if len(input_paths) < 2:
            raise ValueError("Need at least 2 PDF files to merge")

        for p in input_paths:
            if not os.path.exists(p):
                raise FileNotFoundError(f"PDF not found: {p}")

        merged = fitz.open()
        try:
            for pdf_path in input_paths:
                doc = fitz.open(pdf_path)
                try:
                    merged.insert_pdf(doc)
                finally:
                    doc.close()
            out_dir = os.path.dirname(output_path)
            if out_dir and not os.path.exists(out_dir):
                os.makedirs(out_dir, exist_ok=True)
            merged.save(output_path)
        finally:
            merged.close()

        return {
            "output_path": output_path,
            "merged_count": len(input_paths),
        }

    def split(self, input_path, output_dir, mode, param=""):
        """Split a PDF by mode.

        mode = "each_page": each page becomes a separate PDF.
        mode = "ranges":    param is like "1-3,5,7-9".
        """
        import fitz
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"PDF not found: {input_path}")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        doc = fitz.open(input_path)
        total_pages = len(doc)
        results = []

        try:
            if mode == "each_page":
                for i in range(total_pages):
                    out_path = os.path.join(
                        output_dir,
                        f"{os.path.splitext(os.path.basename(input_path))[0]}_page_{i + 1}.pdf",
                    )
                    new_doc = fitz.open()
                    try:
                        new_doc.insert_pdf(doc, from_page=i, to_page=i)
                        new_doc.save(out_path)
                        results.append(out_path)
                    finally:
                        new_doc.close()

            elif mode == "ranges":
                ranges = self._parse_ranges(param)
                if not ranges:
                    raise ValueError("No valid page ranges provided")
                for idx, (start, end) in enumerate(ranges):
                    if start < 1 or end > total_pages or start > end:
                        raise ValueError(
                            f"Invalid page range {start}-{end} (PDF has {total_pages} pages)"
                        )
                    out_path = os.path.join(
                        output_dir,
                        f"{os.path.splitext(os.path.basename(input_path))[0]}_part_{idx + 1}.pdf",
                    )
                    new_doc = fitz.open()
                    try:
                        new_doc.insert_pdf(doc, from_page=start - 1, to_page=end - 1)
                        new_doc.save(out_path)
                        results.append(out_path)
                    finally:
                        new_doc.close()
            else:
                raise ValueError(f"Unknown split mode: {mode}")
        finally:
            doc.close()

        return {
            "output_dir": output_dir,
            "files": results,
            "count": len(results),
        }

    def rotate(self, input_path, output_path, angle, page_indices="all"):
        """Rotate specified pages by *angle* degrees (90, 180, or 270).

        page_indices is "all" or a comma-separated list of 1-based page numbers.
        """
        import fitz
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"PDF not found: {input_path}")
        if angle not in (90, 180, 270, -90, -180, -270):
            raise ValueError(f"Invalid rotation angle: {angle}")

        doc = fitz.open(input_path)
        total_pages = len(doc)
        try:
            if page_indices == "all":
                indices = list(range(total_pages))
            else:
                indices = []
                for part in page_indices.split(","):
                    part = part.strip()
                    if not part:
                        continue
                    num = int(part)
                    if num < 1 or num > total_pages:
                        raise ValueError(
                            f"Page {num} out of range (PDF has {total_pages} pages)"
                        )
                    indices.append(num - 1)

            if not indices:
                raise ValueError("No pages selected for rotation")

            for i in indices:
                page = doc[i]
                page.set_rotation((page.rotation + angle) % 360)

            out_dir = os.path.dirname(output_path)
            if out_dir and not os.path.exists(out_dir):
                os.makedirs(out_dir, exist_ok=True)
            doc.save(output_path)
        finally:
            doc.close()

        return {
            "output_path": output_path,
            "rotated_pages": len(indices),
            "page_numbers": [i + 1 for i in indices],
        }

    def add_watermark(
        self, input_path, output_path, text, font_size=50, opacity=0.15, rotation=45
    ):
        """Add a diagonal text watermark to every page.

        opacity  (float): 0.0 invisible – 1.0 fully opaque.
        rotation (int):   degrees of text rotation.
        """
        import fitz
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"PDF not found: {input_path}")
        if not text or not text.strip():
            raise ValueError("Watermark text must not be empty")

        # Convert opacity to a gray colour (works well on white backgrounds).
        gray = max(0.0, min(1.0, 1.0 - opacity))
        alpha = math.radians(rotation)

        doc = fitz.open(input_path)
        page_count = len(doc)
        try:
            for page in doc:
                rect = page.rect
                cx = rect.width / 2
                cy = rect.height / 2

                text_width = fitz.get_text_length(
                    text, fontname="helv", fontsize=font_size
                )

                # Use Shape with morph for arbitrary rotation around center point.
                shape = page.new_shape()
                shape.insert_text(
                    fitz.Point(cx - text_width / 2, cy + font_size / 4),
                    text,
                    fontsize=font_size,
                    fontname="helv",
                    color=(gray, gray, gray),
                    morph=(fitz.Point(cx, cy), fitz.Matrix(alpha, 1.0)),
                )
                shape.commit()

            out_dir = os.path.dirname(output_path)
            if out_dir and not os.path.exists(out_dir):
                os.makedirs(out_dir, exist_ok=True)
            doc.save(output_path)
        finally:
            doc.close()

        return {
            "output_path": output_path,
            "watermark_text": text,
            "page_count": page_count,
        }

    def extract_images(self, input_path, output_dir):
        """Extract all embedded images from a PDF."""
        import fitz
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"PDF not found: {input_path}")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        doc = fitz.open(input_path)
        results = []
        base_name = os.path.splitext(os.path.basename(input_path))[0]

        try:
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images(full=True)
                for img_idx, img in enumerate(image_list):
                    xref = img[0]
                    try:
                        base_image = doc.extract_image(xref)
                    except Exception:
                        continue
                    ext = base_image.get("ext", "png")
                    img_bytes = base_image.get("image")
                    if not img_bytes:
                        continue

                    out_path = os.path.join(
                        output_dir,
                        f"{base_name}_p{page_num + 1}_img{img_idx + 1}.{ext}",
                    )
                    with open(out_path, "wb") as f:
                        f.write(img_bytes)
                    results.append(out_path)
        finally:
            doc.close()

        return {
            "output_dir": output_dir,
            "images": results,
            "count": len(results),
        }

    # ------------------------------------------------------------------
    #  Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_ranges(param):
        """Parse a range string like '1-3,5,7-9' into [(1,3),(5,5),(7,9)]."""
        ranges = []
        for part in param.split(","):
            part = part.strip()
            if not part:
                continue
            if "-" in part:
                s, e = part.split("-", 1)
                s, e = int(s.strip()), int(e.strip())
                ranges.append((s, e))
            else:
                num = int(part)
                ranges.append((num, num))
        return ranges
