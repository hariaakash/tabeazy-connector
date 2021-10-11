const cron = require('node-cron');

const createCron = (min, cb) => {
  const expr = `*/${min} 7-23 * * *`;
  const task = cron.schedule(expr, cb);

  return task;
};

module.exports = createCron;
