from docx2pdf import convert
from pathlib import Path
import os

def convert_to_pdf(docx_file_path):
    """
    Convert a filled Word template to PDF
    
    Parameters:
    - docx_file_path: Path to the filled DOCX file
    
    Returns:
    - Path to the generated PDF file
    """
    
    # Generate PDF path in generated_pdf folder
    docx_path = Path(docx_file_path)
    pdf_filename = docx_path.stem + '.pdf'
    pdf_path = f'generated_pdf/{pdf_filename}'
    
    # Create generated_pdf directory
    os.makedirs('generated_pdf', exist_ok=True)
    
    # Convert DOCX to PDF
    convert(docx_file_path, pdf_path)
    
    return pdf_path

if __name__=="__main__":
    # Convert any filled template to PDF
    pdf_path = convert_to_pdf('generated_docx/filled_template.docx')
    
    print(f"PDF created: {pdf_path}")