/**
 * NoSQL-injection guard. Mongo query operators arrive as keys that start with `$` (or contain a dot, which addresses nested
 * paths), e.g. `?difficulty[$ne]=x` or `{ "email": { "$gt": "" } }`. No legitimate request here uses such keys, so they are
 * stripped from the body, query and params before any controller sees them.
 */

const isPlainObject = (v) => {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

/** Recursively removes dangerous keys in place and returns how many were dropped. */
function scrub(value) {
  let removed = 0;
  if (Array.isArray(value)) {
    value.forEach((item) => { removed += scrub(item); });
  } else if (isPlainObject(value)) {
    Object.keys(value).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) { delete value[key]; removed += 1; } else { removed += scrub(value[key]); }
    });
  }
  return removed;
}

const sanitize = (req, res, next) => {
  scrub(req.body); scrub(req.query); scrub(req.params);
  next();
};

module.exports = sanitize;
module.exports.scrub = scrub;
