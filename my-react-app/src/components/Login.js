import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function submit(e) {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/login", {
                email: email,
                password: password
            });

            if (response.data.status === 'ok') {
                // Call parent component's onLogin function
                onLogin();
                // Navigate to sidebar or home page
                navigate('/');
            } else {
                setError('Invalid credentials');
            }
        } catch (error) {
            setError('Error occurred during login');
            console.error(error);
        }
    }

return (
    <div className="container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="card p-4" style={{ width: '400px', background: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)', borderRadius: '10px' }}>
            <div className="card-body">
                <h1 className="card-title text-center">Login</h1>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={submit}>
                    <div className="form-group">
                        <input type="email" className="form-control mt-3" onChange={(e) => setEmail(e.target.value)} placeholder="Email" id="email" required />
                    </div>
                    <div className="form-group">
                        <input type="password" className="form-control mt-3" onChange={(e) => setPassword(e.target.value)} placeholder="Password" id="password" required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block mt-3">Login</button>
                </form>
                
            </div>
        </div>
    </div>
 )
}


export default Login;
