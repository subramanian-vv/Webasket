const express = require('express');
const router = express.Router();

const { ensureAuthenticated, sellerAuthenticated } = require('../config/auth');

//User model
const User = require('../models/User');

//Product model
const Product = require('../models/Product');

//Temp dashboard
router.get('/dashboard', ensureAuthenticated, async function(req, res) {
    let products = await Product.find().sort({ createdDate: 'desc' });
    const role = req.user.role;
    if(role == 'buyer') {
        res.render('buyer-dash', {
            name: req.user.name,
            products: products
        });
    } else if(role == 'seller') {
        products = await Product.find({ email: req.user.email }).sort({ createdDate: 'desc' });;
        res.render('seller-dash', {
            name: req.user.name,
            products: products
        });
    }
});

router.get('/add', ensureAuthenticated, sellerAuthenticated, function(req, res) {
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

router.post('/:id', async function(req, res) {
    let product = await Product.findById(req.params.id);
    if(product.itemQty > 0) {
        console.log(product);
        product.itemQty--;
        product = await product.save();
        console.log("Doneeee");
        console.log(product);
        req.flash('success_msg', "Product purchased");
        res.redirect('/user/dashboard');
    } else {
        req.flash('error_msg', "Product not in stock");
        res.redirect('/user/dashboard');
    }
})

module.exports = router;