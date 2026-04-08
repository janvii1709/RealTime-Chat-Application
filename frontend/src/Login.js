import {useState} from 'react'; import axios from 'axios'; import {useNavigate,Link} from 'react-router-dom';
export default function Login(){
  const [form,setForm]=useState({email:'',password:''}); const nav=useNavigate();
  const submit=async()=>{const r=await axios.post('http://localhost:5000/api/auth/login',form);localStorage.setItem('token',r.data.token);localStorage.setItem('user',JSON.stringify(r.data.user));nav('/chat');};
  return <div className='authWrap'><div className='authCard'><h2>Welcome Back</h2>
  <input placeholder='Email' onChange={e=>setForm({...form,email:e.target.value})}/>
  <input type='password' placeholder='Password' onChange={e=>setForm({...form,password:e.target.value})}/>
  <button onClick={submit}>Login</button><p><Link to='/register'>Register</Link></p></div></div>;
}
