document.addEventListener('DOMContentLoaded', function() {
  // Find the nav-placeholder element
  const navPlaceholder = document.getElementById('nav-placeholder');
  console.log('DOMContentLoaded event fired');
  
  if (!navPlaceholder) {
    console.error('Nav placeholder not found! Add <div id="nav-placeholder"></div> to your HTML.');
    return;
  }
  
  // Determine if we're in the templates directory or root
  const path = window.location.pathname;
  const inTemplatesDir = path.includes('/templates/');
  
  // Set the path to navigation.html
  const navPath = inTemplatesDir ? 'navigation.html' : 'templates/navigation.html';
  
  console.log('Loading navigation from:', navPath);
  
  // Fetch the navigation.html content
  fetch(navPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load navigation: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      // Insert the navigation HTML
      navPlaceholder.innerHTML = html;
      console.log('Navigation loaded successfully');

      // Set active class based on current page
      setActiveNavLink();
      
      // Initialize Bootstrap components for dynamically loaded content
      initializeBootstrapComponents();
    })
    .catch(error => {
      console.error('Error loading navigation:', error);
      navPlaceholder.innerHTML = `<div class="alert alert-danger">Error loading navigation: ${error.message}</div>`;
    });
});

// Function to initialize Bootstrap components
function initializeBootstrapComponents() {
  console.log('Initializing Bootstrap components');
  
  // For Bootstrap 5, we need to manually initialize tooltips and popovers
  // but collapse components (like the navbar) should work automatically
  
  // Check if the navbar toggler exists
  const navbarToggler = document.querySelector('.navbar-toggler');
  if (navbarToggler) {
    console.log('Navbar toggler found');
    
    // Log the attributes to verify they're correct
    console.log('Toggle attribute:', navbarToggler.getAttribute('data-bs-toggle'));
    console.log('Target attribute:', navbarToggler.getAttribute('data-bs-target'));
    
    // Ensure the collapse element exists
    const collapseElement = document.querySelector(navbarToggler.getAttribute('data-bs-target'));
    if (collapseElement) {
      console.log('Collapse element found');
    } else {
      console.error('Collapse element not found!');
    }
  } else {
    console.error('Navbar toggler not found!');
  }
}
// Function to set active class on the current page's nav link
function setActiveNavLink() {
  // Get current page path
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  
  console.log('Current page:', page);
  
  // Find all nav links
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  // Loop through links and add active class to the matching one
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Extract just the filename from href
    const hrefPage = href.split('/').pop();
    
    console.log('Checking link:', hrefPage, 'against current page:', page);
    
    if (hrefPage === page) {
      link.classList.add('active');
      console.log('Set active class on:', href);
    }
  });
}

