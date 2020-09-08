const express = require('express');
const router = express.Router();

const { ensureAuthenticated } = require('../config/auth');

//User model
const User = require('../models/User');

//Product model
const Product = require('../models/Product');

//Temp dashboard
router.get('/dashboard', ensureAuthenticated, async function(req, res) {
    const products = await Product.find();
    const role = req.user.role;
    if(role == 'buyer') {
        res.render('buyer-dash', {
            name: req.user.name,
        });
    } else if(role == 'seller') {
        res.render('seller-dash', {
            name: req.user.name,
            products: products
        });
    }
});

router.get('/add', ensureAuthenticated, function(req, res) {
    res.render('addproduct', { product: new Product() });
});

router.post('/dashboard', function(req, res) {
    const { itemName, itemDesc, itemCategory, itemQty, itemPrice } = req.body;
    const email = req.user.email;
    const name = req.user.name;

    if(!itemName || !itemDesc || !itemCategory || !itemQty || !itemPrice) {
        req.flash('error_msg', 'Please fill all the fields');
        res.render('addproduct', {
            itemName: req.body.itemName,
            itemDesc: req.body.itemDesc,
            itemCategory: req.body.itemCategory,
            itemQty: req.body.itemQty,
            itemPrice: req.body.itemPrice
        });
    }

    const newProduct = new Product({
        name,
        email,
        itemName,
        itemDesc,
        itemCategory,
        itemQty,
        itemPrice
    });

    newProduct.save()
        .then(function(product) {
            req.flash('success_msg', 'Product added successfully!');
            res.redirect('/user/dashboard');
            console.log(newProduct);
        })
        .catch(function(err) {
            console.log(err);
            req.flash('error_msg', 'Please fill all the fields');
            res.render('/user/add', {
                itemName,
                itemDesc,
                itemCategory,
                itemQty,
                itemPrice
            });
        });
});

module.exports = router;