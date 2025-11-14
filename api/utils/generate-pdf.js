// /api/utils/generate-pdf.js
import getStream from "get-stream";

let PDFDocument = null;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (e) {
  console.error("PDFKit load error:",e);
  throw e;
}

export async function generatePdfBuffer({
  headerBrand,
  titleText,
  question,
  answer,
  astrologySummary="",
  numerologySummary="",
  palmistrySummary="",
  numerologyPack={}
}){
  const doc = new PDFDocument({margin:50});
  const chunks=[];
  doc.on("data",d=>chunks.push(d));
  doc.on("end",()=>{});

  doc.fontSize(20).text(headerBrand,{align:"center"});
  doc.moveDown(0.4);
  doc.fontSize(18).text(titleText,{align:"center"});
  doc.moveDown(1);

  doc.fontSize(14).text("Question:",{underline:true});
  doc.fontSize(12).text(question);
  doc.moveDown(1);

  doc.fontSize(14).text("Answer:",{underline:true});
  doc.fontSize(12).text(answer);
  doc.moveDown(1);

  if(astrologySummary){
    doc.fontSize(14).text("Astrology:",{underline:true});
    doc.fontSize(12).text(astrologySummary);
    doc.moveDown(1);
  }

  if(numerologySummary){
    doc.fontSize(14).text("Numerology:",{underline:true});
    doc.fontSize(12).text(numerologySummary);
    doc.moveDown(1);
  }

  if(palmistrySummary){
    doc.fontSize(14).text("Palmistry:",{underline:true});
    doc.fontSize(12).text(palmistrySummary);
    doc.moveDown(1);
  }

  if(numerologyPack.technicalKeyPoints){
    doc.fontSize(14).text("Key Points:",{underline:true});
    numerologyPack.technicalKeyPoints.forEach(pt=>{
      doc.fontSize(12).text("• "+pt);
    });
    doc.moveDown(1);
  }

  if(numerologyPack.technicalNotes){
    doc.fontSize(14).text("Technical Notes:",{underline:true});
    doc.fontSize(12).text(numerologyPack.technicalNotes);
    doc.moveDown(1);
  }

  doc.end();
  return await getStream.buffer(doc);
}
