const { query } = require('express-validator');

const limitRules = [
  query('limit')
    .optional()
    .custom((value) => {
      if (value === undefined) return true;
      if (typeof value !== 'string' || !/^-?[0-9]+$/.test(value)) {
        throw new Error('limit must be an integer');
      }
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 50) {
        throw new Error('limit must be an integer between 1 and 50');
      }
      return true;
    }),
];

module.exports = { limitRules };
