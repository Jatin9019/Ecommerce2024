import { camparePassword, hashPassowrd } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import  JWT  from "jsonwebtoken";
export const registerController = async(req,res) =>{
    try{
        const {name,email,password,phone,address,answer}=req.body;
        if(!name){
            return res.send({message:"Name is required."})
        }
        if(!email){
            return res.send({message:"Email is required."})
        }
        if(!password){
            return res.send({message:"Password is required."})
        }
        if(!phone){
            return res.send({message:"Phone Number is required."})
        }
        if(!address){
            return res.send({message:"Address is required."})
        }
        if(!answer){
            return res.send({message:"Answer is required."})
        }
        const existingUser = await userModel.findOne({email})
        if (existingUser){
            return res.status(200).send({
                success: false,
                message: "User already registered. Please try with different user."
            })
        }
        const hashedPassword = await hashPassowrd(password);
        const user = await new userModel({name,email,password: hashedPassword,phone,address,answer}).save()

        res.status(201).send({
            success: true,
            message: "user added successfully",
            user
        })

    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in registration",
            error
        })
    }
}
export const loginController = async(req,res) =>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(404).send({success: false, message:"Invalid Email ID or Password"})
        }
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(404).send({success: false, message:"User not found!!"})
        }
        const correctPassword = await camparePassword(password,user.password);
        if(!correctPassword){
            return res.status(200).send({message:"Password is incorrect!"})
        }
        const token = await JWT.sign({_id:user._id},process.env.JWT_SECRET,{expiresIn:"7d"})
        res.status(200).send({
            success:true,
            message:"Login Successfully",
            user:{
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role
            },
            token
        })
    }catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in Login",
            error
        })
    }



}

export const forgotPasswordController=async(req,res)=>{
    try{
        const {email,answer,newPassword}=req.body;
        if(!email){
            res.status(400).send({message:'Email is required'})
        }
        if(!answer){
            res.status(400).send({message:'answer is required'})
        }
        if(!newPassword){
            res.status(400).send({message:'newPassword is required'})
        }
        const user = await userModel.findOne({email,answer})
        if(!user){
            return res.status(404).send({
                success: false,
                message: 'Wrong Email or Answer'
            })
        }
        const hashed = await hashPassowrd(newPassword);
        await userModel.findByIdAndUpdate(user._id,{password:hashed});
        res.status(200).send({
            success:true,
            message:"Password reset successfully"
        })
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Something went wrong',
            error
        })
    }
}

export const updateProfileController = async(req,res) => {
    try{
        const {name,email,password,address,phone}=req.body
        const user = await userModel.findById(req.user._id);
        if(password && password.length<6){
            return res.json({error:"Password is required and 6 characters long"})
        }
        const hashedPassword = password ? await hashPassowrd(password) : undefined
        const updatedUser = await userModel.findByIdAndUpdate(req.user._id,{
            name: name || user.name,
            password: hashedPassword || user.password,
            phone: phone || user.phone,
            address: address || user.address
        },{new:true})
        console.log(updatedUser)
        res.status(200).send({
            success: true,
            message:"Successfully Updated",
            updatedUser
        })
    }catch(error){
        console.log(error);
        res.status(400).send({
            success:false,
            message:"Error while updating profile",
            error
        })
    }
}

export const getOrdersController = async(req,res) =>{
    try{
        const orders = await orderModel.find({buyer:req.user._id}).populate("buyer","name").populate("products","-photo")
        res.json(orders)
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while getting orders",
            error
        })
    }
}

export const getAllOrdersController = async(req,res) => {
    try{
        const orders = await orderModel.find({}).populate("buyer","name").populate("products","-photo").sort({createdAt:"-1"})
        res.json(orders)
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while getting orders",
            error
        })
    }
}

export const orderStatusController = async(req,res) => {
    try{
        const {orderID} = req.params;
        const {status} = req.body;
        const orders = await orderModel.findByIdAndUpdate(orderID,{status},{new:true})
        res.json(orders);
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Order Status Updation Failed",
            error
        })
    }
}



export const getAllUsers = async(req,res) =>{
    try{
        const users = await userModel.find({})
        res.status(200).send({
            success: true,
            message: "User List",
            users
        })
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while getting users list",
            error
        })
    }
}

export const deleteUserController = async(req,res) => {
    try{
        const {id} = req.params;
        const user = await userModel.findByIdAndDelete(id);
        const orderDelete = await orderModel.findOneAndDelete({"buyer":id})
        res.status(200).send({
            success: true,
            message: "Deletion successfull",
            user,
            orderDelete
        })
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Deletion of user failed",
            error
        })
    }
}

