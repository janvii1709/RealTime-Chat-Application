import {BrowserRouter,Routes,Route} from 'react-router-dom';
import Login from './Login'; import Register from './Register'; import Chat from './Chat';
export default function App(){return <BrowserRouter><Routes>
<Route path='/' element={<Login/>}/><Route path='/register' element={<Register/>}/><Route path='/chat' element={<Chat/>}/>
</Routes></BrowserRouter>}
