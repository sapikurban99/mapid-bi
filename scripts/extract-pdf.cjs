const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
  const dataBuffer = fs.readFileSync('/Users/ptmultiarealplaningindonesia/Desktop/my webapp/mapid-bi-dashboard/file dokumen/MAPID Pricing (1).pdf');
  const uint8 = new Uint8Array(dataBuffer);
  const parser = new PDFParse(uint8);
  await parser.load();
  const text = await parser.getText();
  console.log(text);
}
main();
