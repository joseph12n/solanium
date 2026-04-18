const productService = require('../services/product.service');

async function list(req, res, next) {
  try {
    const { limit, offset, search } = req.query;
    const rows = await productService.list(req.tenant, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      search,
    });
    res.json({ data: rows, tenant: { id: req.tenant.id, tipo_negocio: req.tenant.tipo_negocio } });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const product = await productService.getById(req.tenant, req.params.id);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = await productService.create(req.tenant, req.body);
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await productService.update(req.tenant, req.params.id, req.body);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await productService.remove(req.tenant, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
