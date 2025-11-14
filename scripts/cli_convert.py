from pathlib import Path
import sys

# Ensure project root is in path when executed from subdirectories
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from PDF_conversion import convert_to_pdf  # noqa: E402


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/cli_convert.py <input_docx_path>", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1]).resolve()
    if not input_path.exists() or input_path.suffix.lower() != ".docx":
        print("Invalid input: must be an existing .docx file", file=sys.stderr)
        return 2

    try:
        pdf_path_str = convert_to_pdf(str(input_path))
        pdf_path = Path(pdf_path_str).resolve()
        if not pdf_path.exists():
            print("Conversion failed: PDF not created", file=sys.stderr)
            return 1
        # Print absolute path to stdout for callers to consume
        print(str(pdf_path))
        return 0
    except Exception as exc:  # pragma: no cover
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())


