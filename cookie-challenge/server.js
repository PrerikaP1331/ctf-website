const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 80;

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// --- DYNAMIC HOMEPAGE LOGIC ---
app.get('/', (req, res) => {
  let isAdmin = false;

  // Check if the user has a valid admin cookie
  if (req.cookies.session) {
    try {
      const decodedJson = Buffer.from(req.cookies.session, 'base64').toString('utf8');
      const sessionData = JSON.parse(decodedJson);
      isAdmin = sessionData.isAdmin === true;
    } catch (e) { /* Ignore invalid cookies */ }
  } else {
    // If no cookie, set the default non-admin one
    const defaultSession = { username: 'guest', isAdmin: false };
    const cookieValue = Buffer.from(JSON.stringify(defaultSession)).toString('base64');
    res.cookie('session', cookieValue);
  }

  // Read the raw index.html file to serve it
  fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading page.');
    
    let finalHtml = html.replace('<!-- ADMIN_LINK_PLACEHOLDER -->', ''); // Default empty replace
    if (isAdmin) {
      // If they are an admin, replace the placeholder with the secret link
      finalHtml = html.replace(
        '<!-- ADMIN_LINK_PLACEHOLDER -->',
        '<div class="admin-section"><h2>Admin Privileges Detected.</h2><p><a href="/admin">Proceed to Admin Panel</a></p></div>'
      );
    }
    
    // Send the (potentially modified) HTML
    res.send(finalHtml);
  });
});

// --- ADMIN PAGE LOGIC (Unchanged) ---
app.get('/admin', (req, res) => {
  const sessionCookie = req.cookies.session;
  if (!sessionCookie) {
    return res.status(403).send('<h1>Access Denied</h1><p>No session cookie provided. Visit the <a href="/">homepage</a> first.</p>');
  }
  try {
    const decodedJson = Buffer.from(sessionCookie, 'base64').toString('utf8');
    const sessionData = JSON.parse(decodedJson);
    if (sessionData.isAdmin === true) {
      res.send('<h1>Admin Panel</h1><p>Welcome, admin! Here is your flag: <strong>flag{cl13nt_s1de_c0ntr0ls_4re_n0t_s3cure}</strong></p>');
    } else {
      res.status(403).send('<h1>Access Denied</h1><p>You are not an admin.</p>');
    }
  } catch (error) {
    res.status(400).send('Invalid session cookie format.');
  }
});

app.listen(PORT, () => {
  console.log(`Cookie challenge server running on port ${PORT}`);
});