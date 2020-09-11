const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    itemDesc: {
        type: String,
        required: true
    },
    itemCategory: {
        type: String,
        required: true
    },
    itemQty: {
        type: Number,
        required: true
    },
    itemPrice: {
        type: Number,
        required: true
    },
    image: {
        data: Buffer, 
		contentType: String 
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;