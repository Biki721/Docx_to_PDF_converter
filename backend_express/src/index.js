import express from "express";
import cors from "cors";
import multer from "multer";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Convert by invoking the Python converter directly via a CLI wrapper
app.post("/api/convert", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: "file is required" });
    }
    if (!req.file.originalname.toLowerCase().endsWith(".docx")) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ detail: "Only .docx files are supported" });
    }

    const projectRoot = path.resolve(__dirname, "../../");
    const pythonCmd =
      process.env.PYTHON || (process.platform === "win32" ? "py" : "python3");
    const cliPath = path.join(projectRoot, "scripts", "cli_convert.py");

    const child = spawn(pythonCmd, [cliPath, req.file.path], {
      cwd: projectRoot,
      shell: process.platform === "win32",
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", (code) => {
      // Remove uploaded temp file
      fs.unlink(req.file.path, () => {});

      if (code !== 0) {
        console.error("Conversion failed", code, stderr);
        return res.status(500).json({ detail: stderr || "Conversion failed" });
      }

      const pdfPath = stdout.trim();
      if (!pdfPath || !fs.existsSync(pdfPath)) {
        return res.status(500).json({ detail: "PDF not produced" });
      }

      res.setHeader("Content-Type", "application/pdf");
      const downloadName = req.file.originalname.replace(/\.docx$/i, ".pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadName}"`
      );
      const stream = fs.createReadStream(pdfPath);
      stream.pipe(res);
      stream.on("close", () => {
        // Cleanup generated file
        fs.unlink(pdfPath, () => {});
      });
      stream.on("error", (err) => {
        console.error("Stream error", err);
        res.end();
        fs.unlink(pdfPath, () => {});
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Server error" });
  }
});

// Serve frontend if present
const frontendDir = path.resolve(__dirname, "../../frontend");
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
