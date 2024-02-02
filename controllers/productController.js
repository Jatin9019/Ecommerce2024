import slugify from "slugify";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import fs from 'fs';
import braintree from "braintree";
import dotenv from "dotenv";

dotenv.config();

var gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY
  });

export const createProductController = async(req,res) => {
    try{
        const {name, slug, description, price, category, quantity, shipping} = req.fields
        const {photo} = req.files

        switch(true){
            case !name: return res.status(500).send({error:'Name is Required'})
            case !description: return res.status(500).send({error:'Description is Required'})
            case !price: return res.status(500).send({error:'Price is Required'})
            case !category: return res.status(500).send({error:'Category is Required'})
            case !quantity: return res.status(500).send({error:'Quantity is Required'})
            case photo && photo.size > 1000000: return res.status(500).send({error:'Photo is Required and should be less than 1mb'})
        }
        const products = new productModel({...req.fields, slug:slugify(name)})
        if(photo){
            products.photo.data=fs.readFileSync(photo.path)
            products.photo.contentType=photo.type
        }
        await products.save()
        res.status(201).send({
            success:true,
            message:"Product Created Successfully",
            products
        })
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: 'Error in creating product'
        })
    }
}

export const getProductController = async(req,res) => {
    try{
        const products = await productModel.find({}).select("-photo").limit(12).sort({createdAt:-1}).populate("category")
        res.status(200).send({
            success: true,
            TotalCount:products.length,
            message: "All Products",
            products,
        })
    }
    catch(error){
        console.log(error),
        res.status(500).send({
            success: false,
            error,
            message: "Error in getting products"
        })
    }
}

export const getSingleProductController = async(req,res) =>{
    try{
        const {slug} = req.params;
        const product = await productModel.find({slug}).select("-photo").populate("category");
        res.status(200).send({
            success: true,
            message:"Single Product",
            product
        })
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success:false,
            error,
            message:"Error in getting single product"
        })
    }
}

export const productPhotoController = async(req,res) => {
    try{
        const product = await productModel.findById(req.params.pid).select("photo");
        if(product.photo.data){
            res.set("Content-type",product.photo.contentType);
            return res.status(200).send(product.photo.data);
        }
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message:"Error in getting product photo"
        })
    }
}

export const deleteProductController = async(req,res) => {
    try{
        await productModel.findByIdAndDelete(req.params.pid).select("-photo")
        res.status(200).send({
            success: true,
            message: "Product deleted successfully"
        })
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error in Deleting Product"
        })
    }
}

export const updateProductController = async(req,res) => {
    try{
        const {name, slug, description, price, category, quantity, shipping} = req.fields
        const {photo} = req.files

        switch(true){
            case !name: return res.status(500).send({error:'Name is Required'})
            case !description: return res.status(500).send({error:'Description is Required'})
            case !price: return res.status(500).send({error:'Price is Required'})
            case !category: return res.status(500).send({error:'Category is Required'})
            case !quantity: return res.status(500).send({error:'Quantity is Required'})
            case photo && photo.size > 1000000: return res.status(500).send({error:'Photo is Required and should be less than 1mb'})
        }
        const products = await productModel.findByIdAndUpdate(req.params.pid,{...req.fields,slug:slugify(name)},{new:true})
        if(photo){
            products.photo.data=fs.readFileSync(photo.path)
            products.photo.contentType=photo.type
        }
        await products.save()
        res.status(201).send({
            success:true,
            message:"Product Updated Successfully",
            products
        })
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error in updating product"
        })
    }
}

export const productFiltersController = async(req,res) =>{
    try{
        let {checked,radio} = req.body;
        let args = {}
        if(checked.length > 0) args.category=checked
        if(radio.length) args.price ={ $gte:radio[0] , $lte:radio[1] }
        const products = await productModel.find(args)
        res.status(200).send({
            success:true,
            products
        })
    }
    catch(error){
        console.log(error);
        res.status(400).send({
            success:false,
            message:"Error in Filtering Productts",
            error
        })
    }
}

export const productCountController = async(req,res) => {
    try{
        const total = await productModel.find({}).estimatedDocumentCount()
        res.status(200).send({
            success: true,
            total
        })
    }
    catch(error){
        console.log(error);
        req.status(400).send({
            success: false,
            message:"Error in product count",
            error
        })
    }
}

export const productListController = async(req,res) => {
    try{
        const perPage=6;
        const page=req.params.page ? req.params.page : 1
        const products = await productModel.find({})
        .select("-photo")
        .skip((page-1)*perPage)
        .limit(perPage)
        .sort({createdAt:-1})

        res.status(200).send({
            success: true,
            products
        })
    }
    catch(error){
        console.log(error)
        res.status(400).send({
            success: false,
            message:"Error in per page ctrl",
            error
        })
    }
}

export const searchProductController = async(req,res) => {
    try{
        const {keyword} = req.params
        const result = await productModel.find({
            $or:[
                {name:{$regex:keyword, $options:"i"}},
                {description:{$regex:keyword, $options:"i"}}
            ]
        }).select("-photo")
        res.json(result);
    }
    catch(error){
        console.log(error);
        res.status(400).send({
            success:false,
            message:"Error in searching product",
            error
        })
    }
}

export const relatedProductController = async(req,res)=>{
    try{
        const {pid,cid}= req.params;
        const products = await productModel.find({
            category: cid,
            _id:{$ne: pid}
        }).select("-photo").limit(3).populate("category")
        res.status(200).send({
            success: true,
            products
        })
    }
    catch(error){
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error while getting related products",
            error
        })
    }
}

export const productCategoryController = async(req,res) =>{
    try{
        const category = await categoryModel.findOne({slug: req.params.slug})
        const products = await productModel.find({category}).populate("category")
        res.status(200).send({
            success: true,
            category,  
            products
        })
        console.log(category)
    }
    catch(error){
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error while getting category wise products",
            error
        })
    }
}

export const braintreeTokenController = async(req,res)=>{
    try{
        gateway.clientToken.generate({},function(error,response){
            if(error){
                res.status(500).send(error)
            }else{
                res.send(response);
            }
        })
    }
    catch(error){
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error while getting token",
            error
        })
    }
}
export const braintreePaymentController = async(req,res)=>{
    try{
        const {cart,nonce} = req.body
        let total = 0
        cart.map((i) => {
            total+=i.price
        })
        let newTransaction = gateway.transaction.sale({
            amount: total,
            paymentMethodNonce: nonce,
            options:{
                submitForSettlement: true
            }
        },
        function(error,result){
            if(result){
                const order = new orderModel({
                    products: cart,
                    payment: result,
                    buyer: req.user._id
                }).save()
                res.json({ok: true})
            }else{
                res.status(500).send(error);
            }
        }
        )
    }
    catch(error){
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error while getting token",
            error
        })
    }
}