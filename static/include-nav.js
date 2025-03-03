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

      // Adjust navigation links based on current location
      adjustNavLinks();

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

// Function to adjust navigation links based on current location
function adjustNavLinks() {
  // Check if we're in the root directory or templates directory
  const isRootDirectory = !window.location.pathname.includes('/templates/');
  
  if (isRootDirectory) {
    console.log('Adjusting links for root directory');
    // We're in the root directory, so add templates/ to the href
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      // Don't modify links that already have templates/ or are pointing to index.html
      if (!href.includes('templates/') && href !== '../index.html') {
        link.setAttribute('href', 'templates/' + href);
        console.log('Adjusted link:', link.getAttribute('href'));
      }
    });
    
    // Fix the home link to point to index.html in root
    const homeLinks = document.querySelectorAll('.navbar-nav .nav-link[href="../index.html"]');
    homeLinks.forEach(link => {
      link.setAttribute('href', 'index.html');
      console.log('Fixed home link:', link.getAttribute('href'));
    });
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

