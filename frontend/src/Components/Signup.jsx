import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { handleGoogleLogin } from '../utils/authUtils';

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a0f0f 0%, #2d1810 50%, #3d1f10 100%)", padding: "20px" },
  card: { background: "rgba(255,248,240,0.08)", backdropFilter: "blur(20px)", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" },
  title: { fontSize: "28px", fontWeight: "700", textAlign: "center", marginBottom: "5px", color: "#fff" },
  sub: { textAlign: "center", color: "rgba(255,255,255,0.6)", marginBottom: "25px", fontSize: "14px" },
  input: { width: "100%", padding: "14px 14px 14px 45px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", fontSize: "14px", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none", boxSizing: "border-box", marginBottom: "15px" },
  icon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "rgba(255,255,255,0.4)" },
  inpWrap: { position: "relative", marginBottom: "15px" },
  toggle: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "4px", fontSize: "16px" },
  btn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "10px" },
  div: { display: "flex", alignItems: "center", margin: "20px 0" },
  line: { flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" },
  or: { padding: "0 12px", color: "rgba(255,255,255,0.5)", fontSize: "12px" },
  ggBtn: { width: "100%", padding: "12px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  link: { textAlign: "center", marginTop: "20px", color: "rgba(255,255,255,0.6)", fontSize: "13px" },
  a: { color: "#fb923c", textDecoration: "none", fontWeight: "600" },
};

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      console.log('Signup:', form);
      toast.success("Signup successful!");
      setForm({ username: '', email: '', password: '', confirmPassword: '' });
      setLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(249,115,22,0.4)}.input::placeholder{color:rgba(255,255,255,0.4)}.input:focus{border-color:#f97316;background:rgba(255,255,255,0.1)}`}</style>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.sub}>Sign up to get started</p>
          <form onSubmit={handleSubmit}>
            <div style={styles.inpWrap}>
              <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <input style={styles.input} name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
            </div>
            <div style={styles.inpWrap}>
              <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <input style={styles.input} name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            </div>
            <div style={styles.inpWrap}>
              <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              <input style={styles.input} name="password" type={showPwd ? "text" : "password"} placeholder="Password" value={form.password} onChange={handleChange} required />
              <button style={styles.toggle} type="button" onClick={() => setShowPwd(!showPwd)}>{showPwd ? "👁️" : "👁️‍🗨️"}</button>
            </div>
            <div style={styles.inpWrap}>
              <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <input style={styles.input} name="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
              <button style={styles.toggle} type="button" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? "👁️" : "👁️‍🗨️"}</button>
            </div>
            <button style={styles.btn} type="submit" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</button>
          </form>
          <div style={styles.div}><span style={styles.line}></span><span style={styles.or}>or</span><span style={styles.line}></span></div>
          <button style={styles.ggBtn} onClick={() => handleGoogleLogin(toast)}>🔵 Continue with Google</button>
          <p style={styles.link}>Already have an account? <Link to="/" style={styles.a}>Login</Link></p>
        </div>
      </div>
    </>
  );
};

export default Signup;

