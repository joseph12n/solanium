const svc = require('../services/template.service');

async function list(req, res, next) {
  try {
    res.json({ data: await svc.list(req.tenant) });
  } catch (err) { next(err); }
}

async function listPresets(_req, res) {
  res.json({ data: svc.listPresets() });
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

async function applyPreset(req, res, next) {
  try {
    const { slug } = req.body;
    res.status(201).json({ data: await svc.applyPreset(req.tenant, slug) });
  } catch (err) { next(err); }
}

module.exports = { list, listPresets, getById, create, update, remove, applyPreset };
