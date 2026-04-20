const svc = require('../services/user.service');
const userRepo = require('../repositories/user.repository');

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

async function login(req, res, next) {
  try {
    res.json({ data: await svc.login(req.body) });
  } catch (err) { next(err); }
}

async function listSuperAdmins(_req, res, next) {
  try {
    res.json({ data: await userRepo.listSuperAdmins() });
  } catch (err) { next(err); }
}

async function createSuperAdmin(req, res, next) {
  try {
    // bootstrap si no existe ningún super_admin todavía (lo decide el service)
    const count = await userRepo.countSuperAdmins();
    const data = await svc.createSuperAdmin(req.body, {
      bootstrap: count === 0,
      calledBy: req.superAdmin ? { role: 'super_admin' } : null,
    });
    res.status(201).json({ data });
  } catch (err) { next(err); }
}

async function me(req, res) {
  res.json({
    data: {
      tenant: req.tenant || null,
      activation: req.activation || null,
    },
  });
}

module.exports = {
  list, getById, create, update, remove,
  login, listSuperAdmins, createSuperAdmin, me,
};
