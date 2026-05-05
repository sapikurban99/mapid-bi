import fs from 'fs';
import pdf from 'pdf-parse';

async function main() {
  const dataBuffer = fs.readFileSync('/Users/ptmultiarealplaningindonesia/Desktop/my webapp/mapid-bi-dashboard/file dokumen/MAPID Pricing (1).pdf');
  const data = await pdf(dataBuffer);
  console.log(data.text);
}
main();
