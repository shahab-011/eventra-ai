import Redis from 'ioredis';
import logger from './logger.js';

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: false,
});

redis.on('error', err => logger.error({ err }, 'Redis error'));
redis.on('connect', () => logger.info('Redis connected'));

export default redis;
