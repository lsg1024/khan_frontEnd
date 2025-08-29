import { BrowserRouter, Routes, Route } from "react-router-dom"; 

import JoinPage from './pages/LoginPage'; 
import './App.css' 

function App() { return ( 
  <> 
    <BrowserRouter> 
      <Routes> 
          <Route path="/login" element={<JoinPage />} /> 
      </Routes> 
    </BrowserRouter> 
  </> 
); }

export default App

