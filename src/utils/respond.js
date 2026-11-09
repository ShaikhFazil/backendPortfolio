const ok = (res, data, meta) =>
  res.json(meta ? { success: true, data, meta } : { success: true, data });
const created = (res, data) => res.status(201).json({ success: true, data });
module.exports = { ok, created };
