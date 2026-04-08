import {useState} from 'react'; import axios from 'axios'; import {useNavigate,Link} from 'react-router-dom';
export default function Register(){
  const [form,setForm]=useState({name:'',email:'',password:''}); const nav=useNavigate();
  const submit=async()=>{await axios.post('http://localhost:5000/api/auth/register',form);nav('/');};
  return <div className='authWrap'><div className='authCard'><h2>Create Account</h2>
  <input placeholder='Name' onChange={e=>setForm({...form,name:e.target.value})}/>
  <input placeholder='Email' onChange={e=>setForm({...form,email:e.target.value})}/>
  <input type='password' placeholder='Password' onChange={e=>setForm({...form,password:e.target.value})}/>
  <button onClick={submit}>Register</button><p><Link to='/'>Login</Link></p></div></div>;
}
