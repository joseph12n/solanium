// Fuente única de verdad para validaciones compartidas entre backend y frontend.
// Añadir aquí cualquier esquema nuevo para exponerlo desde `@solanium/shared`.
module.exports = {
  ...require('./product.schema'),
  ...require('./customer.schema'),
  ...require('./template.schema'),
  ...require('./invoice.schema'),
  ...require('./user.schema'),
  ...require('./activation.schema'),
};
