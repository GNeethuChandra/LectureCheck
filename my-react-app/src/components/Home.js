import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Import your CSS file for additional styling

function Home() {
  return (
    <div className="home-container">
      <div className="container">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="home-content">
              <h1 className="home-heading">WELCOME TO LECTURE CHECK</h1>
              <p className="home-text">
                
                
              
              </p>
              <p className="home-text">
                
                
              
              </p>
              <Link to="/uploadvd" className="btn btn-primary btn-lg home-button">Get Started</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
