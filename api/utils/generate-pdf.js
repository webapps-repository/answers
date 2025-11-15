// /api/utils/generate-pdf.js
import PDFDocument from "pdfkit";

export async function generatePdfBuffer(data){
  return new Promise((resolve,reject)=>{
    try{
      const doc = new PDFDocument({ margin:40 });
      const chunks = [];

      doc.on("data", c => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text(data.headerBrand,{align:"center"});
      doc.moveDown(1);
      doc.fontSize(14).text("Your Detailed Report",{align:"center"});
      doc.moveDown(2);

      doc.fontSize(12).text(`Question: ${data.question}`);
      doc.moveDown();
      doc.text(`Answer: ${data.answer}`);
      doc.moveDown();

      if(data.astrologySummary){
        doc.fontSize(14).text("Astrology", {underline:true});
        doc.fontSize(12).text(data.astrologySummary);
        doc.moveDown();
      }

      if(data.numerologySummary){
        doc.fontSize(14).text("Numerology",{underline:true});
        doc.fontSize(12).text(data.numerologySummary);
        doc.moveDown();
      }

      if(data.palmistrySummary){
        doc.fontSize(14).text("Palmistry",{underline:true});
        doc.fontSize(12).text(data.palmistrySummary);
        doc.moveDown();
      }

      doc.end();
    }catch(e){
      reject(e);
    }
  });
}
