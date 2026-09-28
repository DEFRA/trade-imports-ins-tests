import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pathFromHere = (filename: string): string => fileURLToPath(new URL(filename, import.meta.url));

const safeFile19kbDoc = pathFromHere('./safe-file-19kb.doc');
const safeFile10kbDocx = pathFromHere('./safe-file-10kb.docx');
const safeFile25kbXls = pathFromHere('./safe-file-25kb.xls');
const safeFile50kbXlsx = pathFromHere('./safe-file-50kb.xlsx');
const safeFile1kbPdf = pathFromHere('./safe-file-1kb.pdf');
const safeFile100kbJpg = pathFromHere('./safe-file-100kb.jpg');
const safeFile500kbJpeg = pathFromHere('./safe-file-500kb.jpeg');
const safeFile250bPng = pathFromHere('./safe-file-250b.png');
const restrictedFile10bTxt = pathFromHere('./restricted-file-10b.txt');

export const fileUploadPaths = {
  safeFile19kbDoc,
  safeFile10kbDocx,
  safeFile25kbXls,
  safeFile50kbXlsx,
  safeFile1kbPdf,
  safeFile100kbJpg,
  safeFile500kbJpeg,
  safeFile250bPng,
  restrictedFile10bTxt,
} as const;

export const fileUploadNames = {
  safeFile19kbDoc: path.basename(safeFile19kbDoc),
  safeFile10kbDocx: path.basename(safeFile10kbDocx),
  safeFile25kbXls: path.basename(safeFile25kbXls),
  safeFile50kbXlsx: path.basename(safeFile50kbXlsx),
  safeFile1kbPdf: path.basename(safeFile1kbPdf),
  safeFile100kbJpg: path.basename(safeFile100kbJpg),
  safeFile500kbJpeg: path.basename(safeFile500kbJpeg),
  safeFile250bPng: path.basename(safeFile250bPng),
  restrictedFile10bTxt: path.basename(restrictedFile10bTxt),
} as const;
