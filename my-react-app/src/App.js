import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Upload from './components/Upload.js';
import UploadList from './components/UploadList.js';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [medias, setMedias] = useState([]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      getAllMedias();
    }
  }, [isLoggedIn]);

  const getAllMedias = () => {
    axios
      .get('/api/v1/media/all')
      .then((response) => {
        setMedias(response.data);
      })
      .catch((error) => {
        console.error('Error fetching medias:', error);
      });
  };

  return (
    <BrowserRouter>
      <div className="d-flex">
        {isLoggedIn && (
          <div className='w-auto'>
            <Sidebar />
          </div>
        )}
        <div className='col overflow-auto'>
          <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
          <Routes>
            <Route path='/login' element={<Login onLogin={handleLogin} />} />
            <Route path='/upload'element={isLoggedIn ? <Upload /> : <Navigate to="/login" />}/>
            <Route path='/uploadvd' element={isLoggedIn ? <UploadList medias={medias} /> : <Navigate to="/login" />} />
            <Route path='/' element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
            <Route path='*' element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
