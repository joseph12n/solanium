const svc = require('../services/customer.service');

async function list(req, res, next) {
  try {
    const { limit, offset, search } = req.query;
    const rows = await svc.list(req.tenant, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      search,
    });
    res.json({ data: rows });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    res.json({ data: await svc.getById(req.tenant, req.params.id) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    res.status(201).json({ data: await svc.create(req.tenant, req.body) });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    res.json({ data: await svc.update(req.tenant, req.params.id, req.body) });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    res.json(await svc.remove(req.tenant, req.params.id));
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
