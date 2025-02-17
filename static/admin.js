console.log("start of admin.js");

// Import the AWS Amplify library and configuration
import Amplify from 'aws-amplify';
import awsconfig from './aws-exports.js';

// Configure Amplify
Amplify.configure(awsconfig);

// Sign In function
async function signIn() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const user = await Amplify.Auth.signIn(username, password);
        console.log('Sign in success', user);
        showContent(user);
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Error signing in: ' + error.message);
    }
}

// Sign Out function
async function signOut() {
    try {
        await Amplify.Auth.signOut();
        console.log('Sign out success');
        hideContent();
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Show content after successful login
function showContent(user) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    document.getElementById('user').textContent = user.username;
}

// Hide content and show login form
function hideContent() {
    document.getElementById('auth').style.display = 'block';
    document.getElementById('content').style.display = 'none';
}

// Check if user is already signed in
Amplify.Auth.currentAuthenticatedUser()
    .then(user => showContent(user))
    .catch(() => hideContent());