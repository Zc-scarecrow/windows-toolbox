"""OCR text recognition using RapidOCR (PaddleOCR ONNX models).

Uses PP-OCRv6 models via ONNX Runtime for high-accuracy Chinese & English
text recognition. Falls back gracefully if rapidocr is not installed.
"""
import os
import logging

logger = logging.getLogger(__name__)


class OcrConverter:
    """Recognize text in images using RapidOCR."""

    def recognize(self, image_path, model_type="mobile"):
        """Recognize text in an image.
    
        Args:
            image_path: Path to the image file (png, jpg, bmp, etc.).
            model_type: "mobile" (faster, default) or "server" (more accurate).
    
        Returns:
            dict with:
                text: full recognized text (lines joined by \n)
                lines: list of recognized text lines
                line_count: number of text lines
                scores: list of confidence scores per line
        """
        from rapidocr import RapidOCR
        from rapidocr.utils.parse_parameters import ModelType
    
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
    
        # RapidOCR 3.x requires Enum values for model_type
        # SMALL (default, balanced, PP-OCRv6 ch), SERVER (most accurate)
        # MOBILE/TINY don't support PP-OCRv6 Chinese, so use SMALL as default
        if model_type == "server":
            ocr_model = ModelType.SERVER
        else:
            ocr_model = ModelType.SMALL
        params = {
            "Det.model_type": ocr_model,
            "Rec.model_type": ocr_model,
        }
    
        engine = RapidOCR(params=params)
        result = engine(image_path)
    
        txts = list(result.txts) if result.txts else []
        scores = [round(float(s), 4) for s in result.scores] if result.scores else []
        full_text = "\n".join(txts)
    
        return {
            "text": full_text,
            "lines": txts,
            "line_count": len(txts),
            "scores": scores,
        }

    def is_available(self):
        """Check whether RapidOCR is installed and importable."""
        try:
            import rapidocr  # noqa: F401
            import onnxruntime  # noqa: F401
            return True
        except ImportError:
            return False
