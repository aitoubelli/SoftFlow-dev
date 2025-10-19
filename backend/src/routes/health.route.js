const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'production-manager-api' });
});

module.exports = router;
