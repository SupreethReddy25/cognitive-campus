/** Unknown `/api/*` routes answer in the API's own JSON shape instead of Express's HTML "Cannot GET". */
const notFound = (req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl.split('?')[0]}` });

module.exports = notFound;
