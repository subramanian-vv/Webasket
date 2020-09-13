const express = require('express');
const router = express.Router();
const multer = require('multer');

var fs = require('fs'); 
var path = require('path');
const plotly = require('plotly')('koyilnet','yTgt3wf4sHhQNUHLMZ4K');

const { ensureAuthenticated, sellerAuthenticated, buyerAuthenticated } = require('../config/auth');

//User model
const User = require('../models/User');

//Product model
const Product = require('../models/Product');

const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function(req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + 
        path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: function(req, file, callback) {
        checkFileType(file, callback);
    }
});

//Check File Type
function checkFileType(file, callback, req, res) {
    //Image extensions
    const filetypes = /jpeg|jpg|png|gif/;
    //Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    //Check mimetype
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname) {
        return callback(null, true);
    } else {
        callback("Error: Images only!");
    }
}

//Buyer and Seller dashboard
router.get('/dashboard', ensureAuthenticated, async function(req, res) {
    let products = await Product.find().sort({ createdDate: 'desc' });
    const role = req.user.role;
    if(role == 'buyer') {
        res.render('buyer-dash', {
            name: req.user.name,
            products: products,
            cart: req.user.cart
        });
    } else if(role == 'seller') {
        products = await Product.find({ email: req.user.email }).sort({ createdDate: 'desc' });;
        res.render('seller-dash', {
            name: req.user.name,
            products: products
        });
    }
});

//Route to add products
router.get('/add', ensureAuthenticated, sellerAuthenticated, function(req, res) {
    res.render('addproduct', { product: new Product() });
});

router.post('/dashboard', upload.single('image'), function(req, res) {
    var newProduct = { 
		name: req.user.name, 
        email: req.user.email, 
        itemName: req.body.itemName,
        itemDesc: req.body.itemDesc,
        itemCategory: req.body.itemCategory,
        itemQty: req.body.itemQty,
        itemPrice: req.body.itemPrice,
		image: { 
			data: fs.readFileSync(path.join('./public/uploads/' + req.file.filename)), 
			contentType: 'image/png'
		} 
	} 

    Product.create(newProduct, function(err) {
        if(err) {
            console.log(err);
            req.flash('error_msg', 'Images only!');
            res.render('/user/add', {
                            itemName,
                            itemDesc,
                            itemCategory,
                            itemQty,
                            itemPrice,
                            image
                        });
        } else {
            req.flash('success_msg', 'Product added successfully!');
            res.redirect('/user/dashboard');
        }
    })
});

router.get('/cart', ensureAuthenticated, buyerAuthenticated, async function(req, res) {
    const products = await Product.find().sort({ createdDate: 'desc' });
    const totalItems = req.user.cart.length;
    let totalPrice = 0;
    req.user.cart.forEach(function(cartElement) {
        totalPrice += parseFloat(cartElement.price);
    });
    res.render('buyer-cart', {
        name: req.user.name,
        cart: req.user.cart,
        purchases: req.user.purchases,
        products: products,
        totalItems,
        totalPrice
    });
});

//Route to add items to cart
router.post('/cart/:id', async function(req, res) {
    const { quantity } = req.body;
    let product = await Product.findById(req.params.id);
    let user = req.user;
    let cartObject = {
        id: product.id,
        name: product.itemName,
        category: product.itemCategory,
        qty: quantity,
        price: quantity*product.itemPrice,
        eventDate: new Date().toLocaleDateString()
    };
    
    let itemFlag = true;
    user.cart.forEach(function (cartElement) {
        if(cartElement.id == cartObject.id) {
            itemFlag = false;
            req.flash('error_msg', "Product already in cart");
            res.redirect('/user/cart');
        }
    });

    if(itemFlag) {
        if(quantity > product.itemQty) {
            req.flash('error_msg', "Product quantity exceeds the available stock");
            res.redirect('/user/dashboard');
        } else if(quantity < 1 || Math.floor(quantity) !== Math.ceil(quantity)) {
            req.flash('error_msg', "Product quantity is not a valid integer greater than zero");
            res.redirect('/user/dashboard');
        } else {
            user.cart.push(cartObject);
            user = await user.save();
            req.flash('success_msg', "Product added to cart successfully!");
            res.redirect('/user/cart');
        }
    }
});

//Route to remove items from cart
router.post('/remove/:id', async function(req, res) {
    let product = await Product.findById(req.params.id);
    let user = req.user;
    for(let i = 0; i < user.cart.length; i++) {
        if(user.cart[i].id == product.id) {
            user.cart.splice(i, 1);
            user = await user.save();
            req.flash('success_msg', 'Product removed from the cart');
            res.redirect('/user/dashboard');
            break;
        }
    }
});

router.get('/purchases', ensureAuthenticated, buyerAuthenticated, function(req, res) {
    res.render('buyer-purchases', {
        name: req.user.name,
        cart: req.user.cart,
        purchases: req.user.purchases.sort().reverse()
    });
});

//Route to purchase from cart
router.post('/purchases', async function(req, res) {
    try {
        var products = await Product.find();
        var user = req.user;
        for(let i = 0; user.cart.length > 0; i++) {
            for(let j = 0; j < products.length; j++) {
                if(products[j].id == user.cart[i].id) {
                    let tempProduct = await Product.findById(products[j].id);
                    tempProduct.itemQty = tempProduct.itemQty - user.cart[i].qty;
                    if(tempProduct.itemQty < 0) {
                        req.flash('error_msg', 'An item is currently not in stock. Kindly try again later.');
                        res.redirect('/user/cart');
                        continue;
                    } else {
                        let tempCart = user.cart[i];
                        tempCart.eventDate = new Date().toLocaleDateString();
                        user.purchases.push(tempCart);
                        user.cart.splice(i, 1);
                        let salesHistory = {
                            itemQty: tempCart.qty,
                            itemPrice: tempCart.price,
                            eventDate: tempCart.eventDate,
                            buyerName: req.user.name,
                            buyerEmail: req.user.email
                        }
                        tempProduct.purchases.push(salesHistory);
                        tempProduct = await tempProduct.save();
                        user = await user.save();
                        break;
                    }
                }
            }
            i--;
        }
        req.flash('success_msg', "Product purchased successfully!");
        res.redirect('/user/purchases');
    } 
    catch (err) {
        console.log(err);
        req.flash('error_msg', 'Some error occurred. Please try later');
        res.redirect('/user/cart');
    }
});

//Seller route for sales history 
router.get('/history', ensureAuthenticated, sellerAuthenticated, async function(req, res) {
    const products = await Product.find({ email: req.user.email });
    var graphItem = [];
    var graphPrice = [];
    var totalAmount = 0;
    products.forEach(function(product) {
        let tempQty = 0;
        graphItem.push(product.itemName);
        product.purchases.forEach(function(purchase) {
            tempQty += parseInt(purchase.itemQty);
            totalAmount += parseFloat(purchase.itemPrice);
        });
        graphPrice.push(tempQty);
    });
    //Plotting statistics
    var data = [
        {
          x: graphItem,
          y: graphPrice,
          type: 'bar'
        }
    ];
    var layout = {
        title: 'Product sales details',
        xaxis: {
            title: 'Product name'
        },
        yaxis: {
            title: 'Quantity sold'
        }
    };
    var graphOptions = {layout: layout, filename: 'basic-bar', fileopt: 'overwrite'};
    plotly.plot(data, graphOptions, function (err, msg) {
        console.log(msg);
    });
    res.render('seller-history', {
        name: req.user.name,
        products: products,
        totalAmount
    });
});

//Remove product
router.delete('/:id', async function(req, res) {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('error_msg', 'The product has been removed');
    res.redirect('/user/dashboard');
});

//Edit product
router.get('/edit/:id', ensureAuthenticated, sellerAuthenticated, async function(req, res) {
    const product = await Product.findById(req.params.id);
    res.render('editproduct', {
        itemQty: req.body.itemQty,
        itemPrice: req.body.itemPrice,
        product: product
    });
});

router.put('/:id', async function(req, res) {
    let product = await Product.findById(req.params.id);
    product.itemQty = req.body.itemQty;
    product.itemPrice = req.body.itemPrice;
    try {
        product = await product.save();
        req.flash('success_msg', 'The product details has been updated successfully');
        res.redirect('/user/dashboard');
    }
    catch (err) {
        console.log(err);
        req.flash('error_msg', 'Please fill all the details!');
        res.render('editproduct', {
            itemQty: req.body.itemQty,
            itemPrice: req.body.itemPrice,
            product: product
        });
    }
});

router.get('/search', ensureAuthenticated, function(req, res) {
    res.redirect('/user/dashboard');
});

//Case insensitive search using regular expression
router.post('/search', async function(req, res) {
    const { search } = req.body;
    const products = await Product.find({ itemName: new RegExp(search, 'i') });
    if(req.user.role == 'buyer') {
        res.render('buyer-search', {
            name: req.user.name,
            cart: req.user.cart,
            search,
            products: products
        });
    } else if(req.user.role == 'seller') {
        res.render('seller-search', {
            name: req.user.name,
            cart: req.user.cart,
            search,
            products: products
        });
    }
});

//Handling 404 errors
router.get('*', ensureAuthenticated, function (req, res) { 
    res.render('404', {
        name: req.user.name,
        role: req.user.role,
        cart: req.user.cart
    }); 
});

module.exports = router;