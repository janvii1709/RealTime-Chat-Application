const r=require('express').Router();const bcrypt=require('bcryptjs');const jwt=require('jsonwebtoken');
const User=require('../models/User');const auth=require('../middleware/auth');

r.post('/register',async(req,res)=>{
  const {name,email,password}=req.body;
  if(await User.findOne({email})) return res.status(400).json({message:'User exists'});
  const user=await User.create({name,email,password:await bcrypt.hash(password,10)});
  const token=jwt.sign({id:user._id},process.env.JWT_SECRET);
  res.json({user,token});
});

r.post('/login',async(req,res)=>{
  const {email,password}=req.body;
  const user=await User.findOne({email});
  if(!user||!(await bcrypt.compare(password,user.password))) return res.status(400).json({message:'Invalid credentials'});
  const token=jwt.sign({id:user._id},process.env.JWT_SECRET);
  res.json({user,token});
});

r.get('/users',auth,async(req,res)=>{
  const users=await User.find({_id:{$ne:req.user.id}}).select('-password');
  res.json(users);
});

module.exports=r;
