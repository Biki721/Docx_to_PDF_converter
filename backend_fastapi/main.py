from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import tempfile
import shutil
import os

# Reuse the existing conversion logic
import sys
from pathlib import Path as _Path

# Ensure project root is importable when running this file directly
_PROJECT_ROOT = _Path(__file__).resolve().parents[1]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from PDF_conversion import convert_to_pdf

app = FastAPI(title="DOCX to PDF Converter", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/convert")
async def convert_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="DOCX file to convert"),
):
    if not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are supported")

    
    try:
        # Save uploaded file to a temporary location
        temp_dir = Path(tempfile.mkdtemp(prefix="upload_docx_"))
        input_path = temp_dir / file.filename
        with input_path.open("wb") as out_f:
            shutil.copyfileobj(file.file, out_f)

        # Convert to PDF using existing function
        pdf_path_str = convert_to_pdf(str(input_path))
        pdf_path = Path(pdf_path_str).resolve()

        # Schedule cleanup of temp dir and produced file after response is sent
        def cleanup_paths(paths: list[Path]):
            for p in paths:
                try:
                    if p.is_file():
                        p.unlink(missing_ok=True)
                except Exception:
                    pass
            # Remove temp directory
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass
            

        background_tasks.add_task(cleanup_paths, [input_path])

        if not pdf_path.exists():
            raise HTTPException(status_code=500, detail="Conversion failed: PDF not created")

        # Also schedule removal of the generated PDF after sending
        background_tasks.add_task(lambda p: os.remove(p) if os.path.exists(p) else None, str(pdf_path))

        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=pdf_path.name,
            background=background_tasks,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversion error: {exc}")


# Serve the frontend if present
frontend_dir = Path(__file__).resolve().parents[1] / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="static")


if __name__ == "__main__":
    # Allows running: python backend_fastapi/main.py
    import uvicorn

    uvicorn.run("backend_fastapi.main:app", host="0.0.0.0", port=8000, reload=True)


