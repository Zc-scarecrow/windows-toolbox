"""PDF conversion handler."""
import os


class PdfConverter:
    """Convert PDF to DOCX, Markdown, HTML, and text."""

    def convert(self, input_path, target_format, output_path):
        if target_format == "docx":
            self._to_docx(input_path, output_path)
        elif target_format == "md":
            self._to_markdown(input_path, output_path)
        elif target_format == "html":
            self._to_html(input_path, output_path)
        elif target_format == "txt":
            self._to_text(input_path, output_path)
        else:
            raise ValueError(f"Unsupported PDF target format: {target_format}")

    def _to_docx(self, input_path, output_path):
        from pdf2docx import Converter
        cv = Converter(input_path)
        try:
            cv.convert(output_path, start=0, end=None)
        finally:
            cv.close()

    def _to_markdown(self, input_path, output_path):
        text = self._extract_text_with_layout(input_path)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)

    def _to_html(self, input_path, output_path):
        import fitz
        doc = fitz.open(input_path)
        try:
            html_parts = [
                "<!DOCTYPE html>",
                "<html><head><meta charset=\"utf-8\"></head><body>",
            ]
            for page in doc:
                html_parts.append(page.get_text("html"))
            html_parts.append("</body></html>")
            with open(output_path, "w", encoding="utf-8") as f:
                f.write("\n".join(html_parts))
        finally:
            doc.close()

    def _to_text(self, input_path, output_path):
        import fitz
        doc = fitz.open(input_path)
        try:
            text = "\n\n".join(page.get_text() for page in doc)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text)
        finally:
            doc.close()

    def _extract_text_with_layout(self, input_path):
        import fitz
        doc = fitz.open(input_path)
        try:
            parts = []
            for page in doc:
                blocks = page.get_text("blocks")
                blocks.sort(key=lambda b: (b[1], b[0]))
                for b in blocks:
                    text = b[4].strip()
                    if text:
                        parts.append(text)
                parts.append("")
            return "\n\n".join(parts)
        finally:
            doc.close()
