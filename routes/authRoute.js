import express from 'express';
import {loginController, registerController, forgotPasswordController, updateProfileController, getOrdersController, getAllOrdersController, orderStatusController, getAllUsers, deleteUserController} from '../controllers/authController.js';
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.post('/register', registerController);

router.post('/login', loginController);

router.post('/forgot-password', forgotPasswordController);

router.get("/user-auth", requireSignIn, (req,res)=>{
    res.status(200).send({ok: true});
})

router.get("/admin-auth", requireSignIn, isAdmin, (req,res)=>{
    res.status(200).send({ok: true});
})

router.put("/profile", requireSignIn,updateProfileController)

router.get("/orders", requireSignIn, getOrdersController)

router.get("/all-orders", requireSignIn, isAdmin , getAllOrdersController)

router.put("/order-status/:orderID", requireSignIn, isAdmin, orderStatusController)

router.get("/getAllUsers",requireSignIn,isAdmin,getAllUsers)
router.delete('/user/:id',requireSignIn,isAdmin,deleteUserController)
export default router;