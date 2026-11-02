import assert from 'node:assert/strict';
import {imagePagesPDF,detailsPDF} from '../assets/card-pdf.js';

// Validate byte offsets even when the JPEG stream contains arbitrary binary data.
const blob=imagePagesPDF([{width:10,height:20,bytes:new Uint8Array([255,216,0,128,255,217])},{width:30,height:40,bytes:new Uint8Array([255,216,255,217])}]);
assert.equal(blob.type,'application/pdf');
const buffer=Buffer.from(await blob.arrayBuffer()),text=buffer.toString('latin1');
assert(text.startsWith('%PDF-1.4'));
assert(text.includes('/Count 2'));
const xref=Number(text.match(/startxref\n(\d+)/)[1]);
assert.equal(text.slice(xref,xref+4),'xref');
const entries=text.slice(xref).split('\n').slice(3,11);
entries.forEach((entry,index)=>{const offset=Number(entry.slice(0,10));assert(text.slice(offset).startsWith(`${index+1} 0 obj\n`));});
assert.equal((text.match(/\/Subtype \/Image/g)||[]).length,2);

// Exercise pagination and wrapping for long imported details without a browser.
let pages=0;const drawn=[];
globalThis.document={fonts:{ready:Promise.resolve()},createElement:()=>({getContext:()=>({fillRect(){},fillText(text,x,y){assert(y<1754);drawn.push(text);},measureText:text=>({width:text.length*25})}),toDataURL(){pages++;return 'data:image/jpeg;base64,/9j/2Q==';}})};
const result=await detailsPDF('تفاصيل المشروع',[{heading:'المتطلبات',items:['تفاصيل '.repeat(1000),'a'.repeat(500)]}]);
assert(result.size>0);assert(pages>1);assert(drawn.includes('تفاصيل المشروع'));assert(drawn.every(line=>line.length<=43));
console.log('Passed: multi-page PDF, binary stream offsets, Arabic text rendering, pagination and long-token wrapping.');
