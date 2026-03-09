// Maulik Jewels - Admin Dashboard Logic

// Basic Security Check
if (sessionStorage.getItem('mj_admin_logged_in') !== 'true' && !window.location.href.includes('admin-login.html')) {
    window.location.href = 'admin-login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    renderAdminProducts();
    updateAdminStats();

    // Logout
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('mj_admin_logged_in');
            window.location.href = 'admin-login.html';
        });
    }

    // Modal Controls
    const modal = document.getElementById('product-modal');
    const openAddModalBtn = document.getElementById('open-add-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelModalBtn = document.getElementById('cancel-modal');
    const productForm = document.getElementById('product-form');

    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            document.getElementById('modal-title').innerText = 'Add New Collection Piece';
            document.getElementById('edit-id').value = '';
            productForm.reset();
            modal.style.display = 'flex';
        });
    }

    const closeModal = () => {
        modal.style.display = 'none';
        productForm.reset();
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
    
    // Outside click to close
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Form submission
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProduct();
        });
    }
});

function getProducts() {
    return JSON.parse(localStorage.getItem('mj_products') || '[]');
}

function saveProducts(products) {
    localStorage.setItem('mj_products', JSON.stringify(products));
}

async function renderAdminProducts() {
    // Try fetching from Supabase first
    let products = [];
    if (typeof supabaseClient !== 'undefined') {
        const { data, error } = await supabaseClient.from('products').select('*');
        if (!error) products = data;
        else products = getProducts(); // Fallback to local storage if supabaseClient fails
    } else {
        products = getProducts();
    }
    
    const tableBody = document.getElementById('admin-product-table-body');
    if (!tableBody) return;

    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #64748b;">No products in the catalog.</td></tr>';
        return;
    }

    tableBody.innerHTML = products.map(p => `
        <tr>
            <td><img src="${p.image}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;"></td>
            <td style="font-weight: 500;">
                <div style="font-size: 0.95rem;">${p.name}</div>
                <div style="font-size: 0.75rem; color: #a0aec0;">ID: MJ-REC${p.id}</div>
            </td>
            <td><span class="status-pill" style="background: #f1f5f9; color: #475569;">${p.category}</span></td>
            <td style="font-weight: 600;">$${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td style="font-weight: 500;">${p.stock}</td>
            <td>
                <span class="status-pill ${p.stock > 10 ? 'status-in-stock' : (p.stock > 0 ? 'status-low-stock' : 'status-out-of-stock')}">
                    ${p.stock > 10 ? 'In Stock' : (p.stock > 0 ? 'Low Stock' : 'Out of Stock')}
                </span>
            </td>
            <td>
                <button onclick="editProduct(${p.id})" class="action-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteProduct(${p.id})" class="action-btn delete"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `).join('');
}

async function updateAdminStats() {
    let products = [];
    if (typeof supabaseClient !== 'undefined') {
        const { data } = await supabaseClient.from('products').select('*');
        products = data || [];
    } else {
        products = getProducts();
    }
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const totalValue = products.reduce((total, p) => total + (p.price * p.stock), 0);

    const statTotalEl = document.getElementById('stat-total-products');
    const statLowEl = document.getElementById('stat-low-stock');
    const statValueEl = document.getElementById('stat-total-value');

    if (statTotalEl) statTotalEl.textContent = totalProducts.toLocaleString();
    if (statLowEl) statLowEl.textContent = lowStock.toLocaleString();
    if (statValueEl) statValueEl.textContent = '$' + totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

async function saveProduct() {
    const idField = document.getElementById('edit-id').value;
    
    const newProduct = {
        name: document.getElementById('p-name').value,
        category: document.getElementById('p-category').value,
        price: parseFloat(document.getElementById('p-price').value),
        material: document.getElementById('p-material').value,
        image: document.getElementById('p-image').value,
        description: document.getElementById('p-desc').value,
        stock: parseInt(document.getElementById('p-stock').value)
    };

    if (idField) {
        // Edit existing (Update Supabase)
        const { error } = await supabaseClient
            .from('products')
            .update(newProduct)
            .eq('id', parseInt(idField));

        if (error) {
            console.error("Supabase Update Error:", error);
            alert("Error updating product: " + error.message);
            return;
        }
        alert("Product updated in Supabase!");
    } else {
        // Create new (Insert Supabase)
        const success = await addProductToSupabase(newProduct);
        if(!success) return; // Stop if there was an error
    }

    // Refresh after change
    renderAdminProducts();
    updateAdminStats();
    document.getElementById('product-modal').style.display = 'none';
    document.getElementById('product-form').reset();
}

async function addProductToSupabase(newProduct) {
    console.log("Attempting to insert product:", newProduct);
    const { data, error } = await supabaseClient
        .from('products')
        .insert([newProduct])
        .select();

    if (error) {
        console.error("Supabase Insert Error:", error);
        alert("Error saving: " + error.message + "\n\nTip: Check if your table 'Maulik jewels' has Row Level Security (RLS) enabled and a policy for 'INSERT'.");
        return false;
    } else {
        alert("Product saved to Supabase successfully!");
        return true;
    }
}

function editProduct(id) {
    const products = getProducts();
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('modal-title').innerText = 'Edit Collection Piece';
    document.getElementById('edit-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-material').value = p.material;
    document.getElementById('p-image').value = p.image;
    document.getElementById('p-desc').value = p.description;
    document.getElementById('p-stock').value = p.stock;

    document.getElementById('product-modal').style.display = 'flex';
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this exquisite piece from the catalog? This action cannot be undone.')) {
        if (typeof supabaseClient !== 'undefined') {
            const { error } = await supabaseClient.from('products').delete().eq('id', id);
            if (error) {
                alert("Error deleting from Supabase: " + error.message);
                return;
            }
        }
        
        let products = getProducts();
        products = products.filter(p => p.id !== id);
        saveProducts(products);
        renderAdminProducts();
        updateAdminStats();
    }
}
