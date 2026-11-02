const assert=require('node:assert/strict');
const {validatePDFFile,validateEducationFile}=require('../assets/publishing.js');
(async()=>{
  const valid=new File(['%PDF-1.4\nfixture'], 'details.pdf',{type:'application/pdf'});
  assert.equal(await validatePDFFile(valid),valid);
  await assert.rejects(validatePDFFile(new File(['not a PDF'], 'fake.pdf')));
  await assert.rejects(validatePDFFile(new File(['%PDF-1.4'], 'wrong.txt')));
  await assert.rejects(validatePDFFile(new File(['%PDF-1.4',new Uint8Array(10*1024*1024)], 'large.pdf')));
  await assert.rejects(validatePDFFile(new File([], 'empty.pdf')));
  assert.equal(await validateEducationFile(valid),'pdf');
  assert.equal(await validateEducationFile(new File([new Uint8Array([137,80,78,71,13,10,26,10])],'certificate.png')),'image');
  assert.equal(await validateEducationFile(new File([new Uint8Array([255,216,255,224])],'certificate.jpg')),'image');
  assert.equal(await validateEducationFile(new File(['RIFF0000WEBP'],'certificate.webp')),'image');
  await assert.rejects(validateEducationFile(new File(['not an image'],'fake.png')));
  await assert.rejects(validateEducationFile(new File(['<svg></svg>'],'unsafe.svg')));
  console.log('Passed: publisher PDF signature, file extension, empty file and 10 MB size limit.');
})();
