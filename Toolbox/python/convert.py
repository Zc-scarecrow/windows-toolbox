#!/usr/bin/env python3
"""Toolbox document conversion CLI backend.

Usage:
    python convert.py health
    python convert.py convert <input_path> <source_format> <target_format> <output_path>
    python convert.py long-screenshot <output_path> <image_path> [<image_path> ...]
    python convert.py pdf-toolkit <action> [args...]
    python convert.py ocr <image_path> [model_type]

Output is always JSON printed to stdout.
"""
import sys
import os

# Ensure this script's directory is on sys.path so sibling packages (converters)
# can be imported when invoked from a different working directory.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import json
import traceback

from converters.pdf_converter import PdfConverter
from converters.docx_converter import DocxConverter
from converters.pptx_converter import PptxConverter
from converters.xlsx_converter import XlsxConverter
from converters.long_screenshot_converter import LongScreenshotConverter
from converters.pdf_toolkit import PdfToolkit
from converters.ocr_converter import OcrConverter


def get_health():
    """Return available packages and converters status."""
    health = {
        "ok": True,
        "python_version": "{}.{}.{}".format(*sys.version_info[:3]),
        "packages": {}
    }

    packages = [
        ("pdf2docx", "PDF to DOCX"),
        ("fitz", "PyMuPDF"),
        ("docx", "python-docx"),
        ("pptx", "python-pptx"),
        ("openpyxl", "openpyxl"),
        ("markdown", "markdown"),
        ("cv2", "OpenCV"),
        ("rapidocr", "RapidOCR (PP-OCRv6)"),
        ("onnxruntime", "ONNX Runtime"),
    ]

    for module, label in packages:
        try:
            __import__(module)
            health["packages"][module] = {"available": True, "label": label}
        except Exception as e:
            health["packages"][module] = {"available": False, "label": label, "error": str(e)}

    return health


def convert_file(input_path, source_format, target_format, output_path):
    """Route conversion to the appropriate converter."""
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if source_format == "pdf":
        converter = PdfConverter()
    elif source_format == "docx":
        converter = DocxConverter()
    elif source_format == "pptx":
        converter = PptxConverter()
    elif source_format == "xlsx":
        converter = XlsxConverter()
    else:
        raise ValueError(f"Unsupported source format: {source_format}")

    converter.convert(input_path, target_format, output_path)

    return {
        "success": True,
        "input_path": input_path,
        "output_path": output_path,
        "source_format": source_format,
        "target_format": target_format,
    }


def stitch_long_screenshot(image_paths, output_path):
    """Stitch multiple scrolling screenshots into one long image."""
    if len(image_paths) < 2:
        raise ValueError("Need at least 2 images to stitch")
    for p in image_paths:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Image not found: {p}")

    converter = LongScreenshotConverter(max_overlap_ratio=0.5, search_step=1, blend_rows=15)
    converter.stitch(image_paths, output_path)

    return {
        "success": True,
        "output_path": output_path,
        "image_count": len(image_paths),
    }


def main():
    try:
        args = sys.argv[1:]
        if not args:
            raise ValueError("No command provided")

        cmd = args[0]

        if cmd == "health":
            result = get_health()
        elif cmd == "convert":
            if len(args) != 5:
                raise ValueError("Usage: convert.py convert <input_path> <source_format> <target_format> <output_path>")
            result = convert_file(args[1], args[2], args[3], args[4])
        elif cmd == "long-screenshot":
            if len(args) < 3:
                raise ValueError("Usage: convert.py long-screenshot <output_path> <image_path> [<image_path> ...]")
            result = stitch_long_screenshot(args[2:], args[1])
        elif cmd == "pdf-toolkit":
            result = handle_pdf_toolkit(args[1:])
        elif cmd == "ocr":
            result = handle_ocr(args[1:])
        else:
            raise ValueError(f"Unknown command: {cmd}")

        print(json.dumps({"success": True, "data": result}, ensure_ascii=False))
        sys.exit(0)

    except Exception as e:
        error_info = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }
        print(json.dumps(error_info, ensure_ascii=False))
        sys.exit(1)


def handle_pdf_toolkit(args):
    """Route pdf-toolkit sub-commands to PdfToolkit methods.

    args[0] is the action name; remaining elements are parameters.
    """
    if not args:
        raise ValueError("No pdf-toolkit action provided")
    action = args[0]
    toolkit = PdfToolkit()

    if action == "info":
        if len(args) < 2:
            raise ValueError("Usage: pdf-toolkit info <input_path>")
        return toolkit.get_info(args[1])

    elif action == "merge":
        # args[1] = output_path, args[2:] = input paths
        if len(args) < 4:
            raise ValueError("Usage: pdf-toolkit merge <output_path> <pdf1> <pdf2> [...]")
        return toolkit.merge(args[2:], args[1])

    elif action == "split":
        # args[1] = input_path, args[2] = output_dir, args[3] = mode, args[4] = param
        if len(args) < 4:
            raise ValueError("Usage: pdf-toolkit split <input_path> <output_dir> <mode> [param]")
        param = args[4] if len(args) > 4 else ""
        return toolkit.split(args[1], args[2], args[3], param)

    elif action == "rotate":
        # args[1] = input, args[2] = output, args[3] = angle, args[4] = page_indices
        if len(args) < 4:
            raise ValueError("Usage: pdf-toolkit rotate <input_path> <output_path> <angle> [page_indices]")
        page_indices = args[4] if len(args) > 4 else "all"
        return toolkit.rotate(args[1], args[2], int(args[3]), page_indices)

    elif action == "watermark":
        # args[1]=input args[2]=output args[3]=text args[4]=font_size args[5]=opacity args[6]=rotation
        if len(args) < 4:
            raise ValueError("Usage: pdf-toolkit watermark <input_path> <output_path> <text> [font_size] [opacity] [rotation]")
        font_size = float(args[4]) if len(args) > 4 else 50
        opacity = float(args[5]) if len(args) > 5 else 0.15
        rotation = int(args[6]) if len(args) > 6 else 45
        return toolkit.add_watermark(args[1], args[2], args[3], font_size, opacity, rotation)

    elif action == "extract-images":
        if len(args) < 3:
            raise ValueError("Usage: pdf-toolkit extract-images <input_path> <output_dir>")
        return toolkit.extract_images(args[1], args[2])

    else:
        raise ValueError(f"Unknown pdf-toolkit action: {action}")


def handle_ocr(args):
    """Handle OCR sub-command.

    Usage: ocr <image_path> [model_type]
        model_type: "mobile" (default, faster) or "server" (more accurate)
    """
    if not args:
        raise ValueError("No image path provided. Usage: ocr <image_path> [model_type]")
    image_path = args[0]
    model_type = args[1] if len(args) > 1 else "mobile"
    converter = OcrConverter()
    return converter.recognize(image_path, model_type=model_type)


if __name__ == "__main__":
    main()
