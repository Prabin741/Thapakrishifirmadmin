document.addEventListener('DOMContentLoaded', () => {
    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAlGgvogc92gzviYrGYRoXezIoSkzaZaJs",
        authDomain: "thapakrishifirm.firebaseapp.com",
        databaseURL: "https://thapakrishifirm-default-rtdb.firebaseio.com",
        projectId: "thapakrishifirm",
        storageBucket: "thapakrishifirm.firebasestorage.app",
        messagingSenderId: "58538789662",
        appId: "1:58538789662:web:92589a52fc09406ea2170f",
        measurementId: "G-G6ZF0LERRT"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const auth = firebase.auth();

    // DOM Elements
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const ordersList = document.getElementById('orders-list');

    // Admin credentials (for demo - in production use Firebase Authentication properly)
    const ADMIN_CREDENTIALS = {
        username: "admin",
        password: "thapa123" // Change this to a strong password
    };

    // Check if user is already logged in
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
        loadOrders();
    }

// Login form submission using Firebase Auth
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            localStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
            loadOrders();
        })
        .catch((error) => {
            loginError.textContent = "Login failed: " + error.message;
            loginError.style.display = "block";
        });
});

    // Logout button
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminLoggedIn');
        adminPanel.style.display = "none";
        loginScreen.style.display = "block";
        loginForm.reset();
        loginError.style.display = "none";
    });

    // Show admin panel
    function showAdminPanel() {
        loginScreen.style.display = "none";
        adminPanel.style.display = "block";
    }

    // Load orders from Firebase
    function loadOrders() {
        const ordersRef = database.ref('orders');
        
        ordersRef.on('value', (snapshot) => {
            const orders = snapshot.val();
            ordersList.innerHTML = '';
            
            if (!orders) {
                ordersList.innerHTML = '<p>No orders found.</p>';
                return;
            }
            
            // Convert object to array and sort by timestamp (newest first)
            const ordersArray = Object.entries(orders).map(([key, value]) => ({
                id: key,
                ...value
            })).sort((a, b) => b.timestamp - a.timestamp);
            
            // Display each order
            ordersArray.forEach(order => {
                const orderElement = createOrderElement(order);
                ordersList.appendChild(orderElement);
            });
        });
    }

    // Create HTML for an order
    function createOrderElement(order) {
        const orderDate = new Date(order.timestamp).toLocaleString();
        
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        orderElement.innerHTML = `
            <div class="order-header">
                <span class="order-id">Order #${order.id.substring(0, 8)}</span>
                <span class="order-date">${orderDate}</span>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            
            <div class="customer-info">
                <h3>Customer Information</h3>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${order.customer.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${order.customer.phone}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${order.customer.email || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Address:</span>
                    <span class="info-value">${order.customer.address}</span>
                </div>
            </div>
            
            <div class="order-details">
                <h3>Order Details</h3>
                ${order.order.milk.quantity > 0 ? `
                <div class="product-item">
                    <span class="product-name">Milk</span>
                    <span class="product-quantity">${order.order.milk.quantity} L</span>
                    <span class="product-price">रु ${order.order.milk.total.toFixed(2)}</span>
                </div>
                ` : ''}
                
                ${order.order.fish.quantity > 0 ? `
                <div class="product-item">
                    <span class="product-name">${order.order.fish.type || 'Fish'}</span>
                    <span class="product-quantity">${order.order.fish.quantity} kg</span>
                    <span class="product-price">रु ${order.order.fish.total.toFixed(2)}</span>
                </div>
                ` : ''}
                
                <div class="order-total">
                    Total: रु ${order.order.grandTotal.toFixed(2)}
                </div>
            </div>
            
            ${order.order.notes ? `
            <div class="notes">
                <strong>Notes:</strong> ${order.order.notes}
            </div>
            ` : ''}
            
            <div class="order-actions">
                ${order.status !== 'completed' ? `
                <button class="action-btn complete-btn" data-order-id="${order.id}">Mark Completed</button>
                ` : ''}
                
                ${order.status !== 'cancelled' ? `
                <button class="action-btn cancel-btn" data-order-id="${order.id}">Cancel Order</button>
                ` : ''}
            </div>
        `;
        
        // Add event listeners to action buttons
        const completeBtn = orderElement.querySelector('.complete-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => updateOrderStatus(order.id, 'completed'));
        }
        
        const cancelBtn = orderElement.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => updateOrderStatus(order.id, 'cancelled'));
        }
        
        return orderElement;
    }

    // Update order status in Firebase
    function updateOrderStatus(orderId, newStatus) {
        if (confirm(`Are you sure you want to mark this order as ${newStatus}?`)) {
            database.ref(`orders/${orderId}/status`).set(newStatus)
                .then(() => {
                    alert(`Order status updated to ${newStatus}`);
                })
                .catch(error => {
                    alert(`Error updating order: ${error.message}`);
                });
        }
    }
});