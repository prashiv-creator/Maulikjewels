// Maulik Jewels - Main Script

// Default Product Data
const initialProducts = [
    {
        id: 1,
        name: "Diamond Solitaire Ring",
        category: "Rings",
        price: 2450.00,
        material: "18k White Gold",
        image: "assets/images/diamond_ring.png",
        description: "A classic 1-carat diamond solitaire ring set in premium 18k white gold. Timeless and elegant.",
        stock: 12
    },
    {
        id: 2,
        name: "Emerald Cascade Necklace",
        category: "Necklaces",
        price: 8900.00,
        material: "18k Yellow Gold",
        image: "assets/images/emerald_necklace.png",
        description: "Stunning Colombian emeralds paired with brilliant-cut diamond accents in a cascading design.",
        stock: 5
    },
    {
        id: 3,
        name: "Gold Hoop Earrings",
        category: "Earrings",
        price: 1200.00,
        material: "18k Yellow Gold",
        image: "assets/images/gold_earrings.png",
        description: "Elegant 18k gold hoop earrings with small diamond accents, perfect for daily wear or special occasions.",
        stock: 20
    },
    {
        id: 4,
        name: "South Sea Pearl Bracelet",
        category: "Bracelets",
        price: 1800.00,
        material: "14k Rose Gold",
        image: "assets/images/pearl_bracelet.png",
        description: "Lustrous South Sea pearls suspended from a delicate rose gold bracelet.",
        stock: 8
    }
];

// Initialize Products in LocalStorage
function initProducts() {
    if (!localStorage.getItem('mj_products')) {
        localStorage.setItem('mj_products', JSON.stringify(initialProducts));
    }
}

// Get all products
async function getSupabaseProducts() {
    if (typeof supabaseClient !== 'undefined') {
        const { data, error } = await supabaseClient.from('products').select('*');
        if (!error) return data;
        console.error("Supabase fetch error:", error);
    }
    // Fallback to local storage
    return JSON.parse(localStorage.getItem('mj_products') || '[]');
}

function getLocalProducts() {
    return JSON.parse(localStorage.getItem('mj_products') || '[]');
}

// User Profile Management
let users = [];
try {
    const savedUsers = localStorage.getItem('mj_users');
    users = Array.isArray(JSON.parse(savedUsers)) ? JSON.parse(savedUsers) : [];
} catch (e) {
    users = [];
}
let currentUser = JSON.parse(sessionStorage.getItem('mj_user')) || null;

// Shopping Cart State
let cart = JSON.parse(localStorage.getItem('mj_cart') || '[]');

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initProducts();
    updateCartCount();
    updateAuthUI();
    
    // Navbar Scroll Effect
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.querySelector('.overlay');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            
            // Switch icons
            const icon = menuToggle.querySelector('i');
            if (isOpen) {
                icon.className = 'fa-solid fa-xmark';
                navOverlay.classList.add('active');
            } else {
                icon.className = 'fa-solid fa-bars-staggered';
                navOverlay.classList.remove('active');
            }
        });

        // Close when clicking overlay
        if (navOverlay) {
            navOverlay.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').className = 'fa-solid fa-bars-staggered';
                navOverlay.classList.remove('active');
            });
        }
    }

    // Cart Panel Logic
    const cartBtn = document.getElementById('cart-btn');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const overlay = document.querySelector('.overlay');

    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('open');
            overlay.classList.add('active');
            renderCartItems();
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
});

// Update Cart Count Badge
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.querySelector('.cart-count');
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Add to Cart Function
async function addToCart(productId) {
    const products = await getSupabaseProducts();
    const product = products.find(p => parseInt(p.id) === parseInt(productId));
    
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    localStorage.setItem('mj_cart', JSON.stringify(cart));
    updateCartCount();
    
    // Optional: Open cart after adding
    document.getElementById('cart-sidebar').classList.add('open');
    document.querySelector('.overlay').classList.add('active');
    renderCartItems();
}

// Render Cart Items
function renderCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalContainer = document.querySelector('.cart-total-amount');
    
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 2rem; color: #a0aec0;">Your cart is empty.</p>';
        cartTotalContainer.textContent = '$0.00';
        return;
    }

    let itemsHtml = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        itemsHtml += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">$${item.price.toLocaleString()}</div>
                    <div style="display:flex; align-items:center; gap: 10px; margin-top: 5px;">
                        <button onclick="changeQuantity(${item.id}, -1)" class="icon-btn" style="font-size: 0.8rem">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${item.id}, 1)" class="icon-btn" style="font-size: 0.8rem">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart(${item.id})" class="icon-btn delete-item"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = itemsHtml;
    cartTotalContainer.textContent = '$' + total.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function changeQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            localStorage.setItem('mj_cart', JSON.stringify(cart));
            updateCartCount();
            renderCartItems();
        }
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('mj_cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

// User Authentication Logic
function updateAuthUI() {
    const authContainer = document.querySelector('.nav-actions');
    if (!authContainer) return;

    // Remove existing auth buttons to re-render
    const existingAuth = authContainer.querySelector('.user-auth-area');
    if (existingAuth) existingAuth.remove();

    const authArea = document.createElement('div');
    authArea.className = 'user-auth-area';
    authArea.style.display = 'flex';
    authArea.style.alignItems = 'center';
    authArea.style.gap = '1rem';

    if (currentUser) {
        authArea.innerHTML = `
            <a href="user-dashboard.html" class="icon-btn" title="My Account"><i class="fa-solid fa-user-circle"></i></a>
            <button onclick="userLogout()" class="btn btn-ghost" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Logout</button>
        `;
    } else {
        authArea.innerHTML = `
            <a href="login.html" class="btn btn-ghost" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Login</a>
        `;
    }
    
    // Insert at the end of nav-actions
    authContainer.appendChild(authArea);
}

function userLogout() {
    sessionStorage.removeItem('mj_user');
    window.location.href = 'index.html';
}

// Handle User Signup
function handleSignup(userData) {
    console.log("Attempting signup for:", userData.email);
    
    if (!users || !Array.isArray(users)) {
        users = [];
    }

    const exists = users.find(u => u.email === userData.email);
    if (exists) {
        console.warn("Signup failed: Email already exists.");
        alert('User with this email already exists!');
        return false;
    }
    
    userData.id = Date.now();
    userData.orders = [];
    users.push(userData);
    localStorage.setItem('mj_users', JSON.stringify(users));
    
    console.log("Signup successful. User added to local storage.");
    
    // Auto login
    sessionStorage.setItem('mj_user', JSON.stringify(userData));
    currentUser = userData; // Update the local state variable
    return true;
}

// Handle User Login
function handleLogin(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        sessionStorage.setItem('mj_user', JSON.stringify(user));
        return true;
    }
    return false;
}
