// Thin re-export — all logic lives in services/r2.js.
// studio.js imports presignPut and cdnUrl from here; keep this file for compat.
export {
  presignPut,
  presignUpload,
  getSignedReadUrl,
  headObject,
  getObjectBuffer,
  putObject,
  deleteObject,
  deleteObjects,
  createMultipartUpload,
  presignMultipartPart,
  completeMultipart,
  abortMultipart,
  cdnUrl,
} from '../services/r2.js';
