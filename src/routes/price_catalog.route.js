const router = require('express').Router();
const { createPriceCatalog } = require('../controllers/price_catalog.controller');
const auth = require('../middlewares/auth.middleware');


router.post('/create',auth(["admin"]),createPriceCatalog);
module.exports = router;