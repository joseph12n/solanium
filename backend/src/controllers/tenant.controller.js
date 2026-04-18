const tenantRepo = require('../repositories/tenant.repository');

async function list(_req, res, next) {
  try {
    const rows = await tenantRepo.list();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function current(req, res) {
  res.json({ data: req.tenant });
}

module.exports = { list, current };
