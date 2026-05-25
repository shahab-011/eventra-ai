import { v4 as uuidv4 } from 'uuid';
import logger from '../lib/logger.js';

export function requestContext(req, res, next) {
  req.requestId = uuidv4();
  req.log = logger.child({ requestId: req.requestId });
  res.setHeader('X-Request-Id', req.requestId);

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    req.log.info({ method: req.method, path: req.path, status: res.statusCode, durationMs: durationMs.toFixed(2) }, 'request');
  });

  next();
}
