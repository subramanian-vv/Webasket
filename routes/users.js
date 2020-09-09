const express = require('express');
const router = express.Router();

const { ensureAuthenticated, sellerAuthenticated, buyerAuthenticated } = require('../config/auth');

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
});

router.get('/cart', ensureAuthenticated, buyerAuthenticated, async function(req, res) {
    const products = await Product.find().sort({ createdDate: 'desc' });
    res.render('buyer-cart', {
        name: req.user.name,
        cart: req.user.cart,
        products: products
    });
});

router.post('/cart/:id', async function(req, res) {
    let product = await Product.findById(req.params.id);
    let user = req.user;
    // console.log(user);
    if(user.cart.indexOf(product.id) == -1) {
        // console.log(product);
        user.cart.push(product.id);
        user = await user.save();
        // console.log("Doneeee");
        // console.log(req.user.cart);
        req.flash('success_msg', "Product added to cart successfully!");
        res.redirect('/user/cart');
    } else {
        req.flash('error_msg', "Product already in cart");
        res.redirect('/user/dashboard');
    }
});

router.get('/purchases', ensureAuthenticated, buyerAuthenticated, async function(req, res) {
    const products = await Product.find().sort({ createdDate: 'desc' });
    res.render('buyer-purchases', {
        name: req.user.name,
        purchases: req.user.purchases,
        products: products
    });
});

router.post('/purchases/:id', async function(req, res) {
    let product = await Product.findById(req.params.id);
    let user = req.user;
    // console.log(user);
    const cartId = user.cart.indexOf(product.id);
    if(product.itemQty > 0) {
        // console.log(product);
        // console.log(cartId);
        user.purchases.push(product.id);
        user.cart.splice(cartId, 1);
        product.itemQty--;
        user = await user.save();
        product = await product.save();
        // console.log("Doneeee");
        // console.log(req.user.cart);
        req.flash('success_msg', "Product purchased successfully!");
        res.redirect('/user/purchases');
    } else {
        req.flash('error_msg', "Product not in stock");
        res.redirect('/user/cart');
    }
});

module.exports = router;