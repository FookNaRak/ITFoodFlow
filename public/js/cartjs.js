// Function to load the cart data from the backend
async function loadCart() {
    try {
        const response = await fetch('/cart-items');  // Fetch data from the backend route
        const data = await response.json();  // Parse the response as JSON
        console.log("Cart data received:", data);  // Log data for debugging

        const cartItems = data.data;  // Extract the data array
        const cartItemsContainer = document.getElementById('cart-items');
        cartItemsContainer.innerHTML = ''; // Clear previous cart items

        let total = 0;  // Variable to hold the total price

        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p>ไม่มีสินค้าในตะกร้า</p>';  // Display message if cart is empty
            return;
        }

        // Iterate through each item in the cart
        cartItems.forEach(item => {
            const itemTotal = item.menuPrice * item.quantity;  // Calculate total price for this item
            total += itemTotal;  // Add to total cart price

            // Create a table row for the cart item
            const cartItemRow = document.createElement('tr');
            cartItemRow.innerHTML = `
                <td><alt="${item.menuName}"> ${item.menuName}</td>
                <td>${item.quantity}</td>
                <td>${itemTotal} ฿</td>
                <td><button onclick="deleteItem(${item.menuID})">X</button></td>
            `;
            cartItemsContainer.appendChild(cartItemRow);  // Append the row to the table body
        });

        // Update the total price display
        document.getElementById('total-price').textContent = `ราคาทั้งหมด: ${total} ฿`;

    } catch (error) {
        console.error('Error loading cart:', error);  // Log any errors that occur
    }
}

// Function to delete a cart item by its menuID
async function deleteItem(menuID) {
    const confirmDelete = confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?');  // Confirm deletion with the user

    if (confirmDelete) {
        try {
            const response = await fetch(`/menu/${menuID}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                loadCart();  // Reload the cart after successful deletion
            } else {
                alert('ลบรายการไม่สำเร็จ');
                console.error('Error deleting item:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    }
}

// Function to load all cart information (New Method)
async function loadAllCartInfo() {
    try {
        const response = await fetch('/all-cart-info');  // Fetch data from the new route
        const data = await response.json();
        console.log("All cart information received:", data);

        const cartItemsContainer = document.getElementById('cart-items');
        cartItemsContainer.innerHTML = ''; // Clear previous cart items

        if (data.data.length === 0) {
            cartItemsContainer.innerHTML = '<p>No items in the cart</p>';  // Message when cart is empty
            return;
        }

        data.data.forEach(item => {
            cartItemRow.innerHTML = `
            <td>${item.menuName}</td>
            <td>${item.quantity}</td>
            <td>${itemTotal} ฿</td>
            <td><button onclick="deleteItem(${item.menuID})">X</button></td>`;
            cartItemsContainer.appendChild(cartItemRow);
        });
    } catch (error) {
        console.error('Error loading all cart info:', error);  // Log any errors that occur
    }
}

// Event listener to load the cart when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadCart();  // Automatically load the cart when the page is loaded
});
