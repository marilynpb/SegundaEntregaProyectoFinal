const express = require('express');
const router = express.Router();

router.get('/', (req, res)=>{
    res.render('home')
})

router.get('/home', (req, res)=>{
    res.render('homeLogin')
})

module.exports = router