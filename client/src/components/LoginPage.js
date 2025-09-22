import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import loginBg from '../images/login-bg.gif';
import nisbLogo from '../icons/nisb-logo.png'; 
import csLogo from '../icons/cs-logo.png';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        navigate('/story');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // In LoginPage.js, replace the entire return statement

    return (
    <div
      className={styles.pageContainer}
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Top-left corner for the college logo */}
      <div className={styles.topLeft}>
        <img src={nisbLogo} alt="College Logo" className={styles.logo} />
      </div>

      {/* Top-right corner for the society logos */}
      <div className={styles.topRight}>
        <img src={csLogo} alt="Computer Society Logo" className={styles.logo} />
      </div>
      
      {/* Wrapper to position the login form in the bottom-left */}
      <div className={styles.loginFormWrapper}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <h2>Login Page</h2>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Let's save the islands!!</button>
        </form>
      </div>

      {/* Bottom-right corner for the CTF title */}
      <div className={styles.bottomRight}>
        <span className={styles.mainTitle}>RUBIX CTF 2025</span>
      </div>
    </div>
  );
}

export default LoginPage;