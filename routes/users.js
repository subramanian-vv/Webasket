const express = require('express');
const router = express.Router();
const multer = require('multer');

var fs = require('fs'); 
var path = require('path');

const { ensureAuthenticated, sellerAuthenticated, buyerAuthenticated } = require('../config/auth');

//User model
const User = require('../models/User');

//Product model
const Product = require('../models/Product');

// var storage = multer.diskStorage({ 
// 	destination: (req, file, cb) => { 
// 		cb(null, './routes/uploads') 
// 	}, 
// 	filename: (req, file, cb) => { 
// 		cb(null, file.fieldname + '-' + Date.now()) 
// 	} 
// }); 

// var upload = multer({ storage: storage }); 

const storage = multer.diskStorage({
    destination: './routes/uploads',
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
})

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

router.post('/dashboard', upload.single('image'), function(req, res) {
    // const { itemName, itemDesc, itemCategory, itemQty, itemPrice } = req.body;
    // const email = req.user.email;
    // const name = req.user.name;
    // const image = {
    //         data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
	// 		contentType: 'image/png'
    // }

    // if(!itemName || !itemDesc || !itemCategory || !itemQty || !itemPrice) {
    //     req.flash('error_msg', 'Please fill all the fields');
    //     res.render('addproduct', {
    //         itemName: req.body.itemName,
    //         itemDesc: req.body.itemDesc,
    //         itemCategory: req.body.itemCategory,
    //         itemQty: req.body.itemQty,
    //         itemPrice: req.body.itemPrice
    //     });
    // }

    var newProduct = { 
		name: req.user.name, 
        email: req.user.email, 
        itemName: req.body.itemName,
        itemDesc: req.body.itemDesc,
        itemCategory: req.body.itemCategory,
        itemQty: req.body.itemQty,
        itemPrice: req.body.itemPrice,
		image: { 
			data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
			contentType: 'image/png'
		} 
	} 

    // const newProduct = new Product({
    //     name,
    //     email,
    //     itemName,
    //     itemDesc,
    //     itemCategory,
    //     itemQty,
    //     itemPrice,
    //     image
    // });

    // newProduct.save()
    //     .then(function(product) {
    //         req.flash('success_msg', 'Product added successfully!');
    //         res.redirect('/user/dashboard');
    //         console.log(newProduct);
    //     })
    //     .catch(function(err) {
    //         console.log("Errorrrrrrrrrr");
    //         console.log(err);
    //         req.flash('error_msg', 'Please fill all the fields');
    //         res.render('/user/add', {
    //             itemName,
    //             itemDesc,
    //             itemCategory,
    //             itemQty,
    //             itemPrice,
    //             image
    //         });
    //     });

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
            console.log(newProduct);
        }
    })
});

// router.post('/:id', async function(req, res) {
//     let product = await Product.findById(req.params.id);
//     if(product.itemQty > 0) {
//         console.log(product);
//         product.itemQty--;
//         product = await product.save();
//         console.log("Doneeee");
//         console.log(product);
//         req.flash('success_msg', "Product purchased");
//         res.redirect('/user/dashboard');
//     } else {
//         req.flash('error_msg', "Product not in stock");
//         res.redirect('/user/dashboard');
//     }
// });

router.get('/cart', ensureAuthenticated, buyerAuthenticated, async function(req, res) {
    const products = await Product.find().sort({ createdDate: 'desc' });
    res.render('buyer-cart', {
        name: req.user.name,
        cart: req.user.cart,
        purchases: req.user.purchases,
        products: products
    });
});

router.post('/cart/:id', async function(req, res) {
    const { quantity } = req.body;
    let product = await Product.findById(req.params.id);
    let user = req.user;
    let cartObject = {
        id: product.id,
        name: product.itemName,
        category: product.itemCategory,
        qty: quantity,
        price: quantity*product.itemPrice
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
            console.log(quantity);
            user.cart.push(cartObject);
            user = await user.save();
            console.log("Doneeee");
            console.log(req.user.cart);
            req.flash('success_msg', "Product added to cart successfully!");
            res.redirect('/user/cart');
        }
    }
});

// router.get('/purchases', ensureAuthenticated, buyerAuthenticated, function(req, res) {
//     // const products = await Product.find().sort({ createdDate: 'desc' });
//     res.render('buyer-purchases', {
//         name: req.user.name,
//         purchases: req.user.purchases,
        
//     });
// });

router.get('/purchases', async function(req, res) {
    let products = await Product.find();
    let user = req.user;
    // console.log(user);
    // console.log(products);
    user.cart.forEach(function(cartElement) {
        products.forEach(async function(product) {
            // console.log("Product id " + product.id);
            // console.log("Cart id " + cartElement.id);
            console.log("First");
            console.log(cartElement.name);
            console.log(product.itemName);
            if(product.itemName == cartElement.name) {
                let tempProduct = await Product.findById(product.id);
                user.purchases.push(cartElement);
                user.cart.splice(cartElement, 1);
                product.itemQty = product.itemQty - cartElement.qty;
                console.log("Second");
                tempProduct = await tempProduct.save();
            }
        });
    });

    user = await user.save();
    req.flash('success_msg', "Product purchased successfully!");
    // res.redirect('/user/purchases');
    res.render('buyer-purchases', {
        name: req.user.name,
        purchases: req.user.purchases,
        
    });

    // if(product.itemQty > 0) {
    //     // console.log(product);
    //     // console.log(cartId);
    //     user.purchases.push(product.id);
    //     user.cart.splice(cartId, 1);
    //     product.itemQty--;
    //     user = await user.save();
    //     product = await product.save();
    //     // console.log("Doneeee");
    //     // console.log(req.user.cart);
    //     req.flash('success_msg', "Product purchased successfully!");
    //     res.redirect('/user/purchases');
    // } else {
    //     req.flash('error_msg', "Product not in stock");
    //     res.redirect('/user/cart');
    // }
});

module.exports = router;