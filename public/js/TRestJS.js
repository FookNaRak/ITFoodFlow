document.addEventListener('DOMContentLoaded', () => {
    let cart = [];
    let quantity = 1;
    let selectedMenuID = null; // This will store the menuID for the currently selected menu item

    const increaseButton = document.getElementById('increase');
    const decreaseButton = document.getElementById('decrease');
    const quantityDisplay = document.getElementById('quantity');
    const menuPage = document.querySelector('.menu-page');
    const menuDetailPage = document.querySelector('.menu-detail-page');

    // Reset quantity function
    const resetQuantity = () => {
        quantity = 1;
        quantityDisplay.textContent = quantity;
    };

    // Function to increase quantity
    const increaseQuantity = () => {
        quantity++;
        quantityDisplay.textContent = quantity;
    };

    // Function to decrease quantity
    const decreaseQuantity = () => {
        if (quantity > 1) {
            quantity--;
            quantityDisplay.textContent = quantity;
        }
    };

    // Function to show menu details
    window.showMenuDetail = function(itemName, price, menuID) {
        menuPage.style.display = 'none';
        menuDetailPage.style.display = 'block';

        menuDetailPage.querySelector('h2').textContent = itemName;
        menuDetailPage.querySelector('.add-cart-button span:nth-child(2)').textContent = `${price}฿`;

        resetQuantity();
        selectedMenuID = menuID;  // Store the menuID when a menu is selected

        increaseButton.removeEventListener('click', increaseQuantity);
        decreaseButton.removeEventListener('click', decreaseQuantity);

        increaseButton.addEventListener('click', increaseQuantity);
        decreaseButton.addEventListener('click', decreaseQuantity);
    };

    // Function to add item to cart
    const addToCartButton = document.querySelector('.add-cart-button');
    addToCartButton.addEventListener('click', () => {
        const note = document.querySelector('textarea').value;

        if (selectedMenuID !== null) {
            fetch('/add-to-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    menuID: selectedMenuID,
                    userID: 1,  // Assuming userID is 1 for testing
                    quantity: quantity,
                    note: note.trim() === "" ? null : note  // Insert null if note is empty
                })
            }).then(response => response.json())
              .then(data => console.log(data))
              .catch(error => console.error('Error:', error));

            showSuccessMessage();
        } else {
            console.error("No menuID selected.");
        }
    });

    const showSuccessMessage = () => {
        const successMessage = document.querySelector('.add-success');
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 2000);
    };

    // Event listener for the back button on the menu detail page
    const backToMenuButton = document.querySelector('.back-to-menu-button');
    backToMenuButton.addEventListener('click', () => {
        menuDetailPage.style.display = 'none';
        menuPage.style.display = 'block';
    });

    // Load menu items and display them
    const loadMenu = () => {
        fetch('/menu-items')
            .then(response => response.json())
            .then(data => {
                console.log(data); // Log the fetched data for debugging
                
                const menuList = document.querySelector('.menu-list');
                menuList.innerHTML = '';  // Clear existing content

                // Check if data.data exists and is an array before calling forEach
                if (Array.isArray(data.data)) {
                    data.data.forEach(item => {
                        const menuItem = document.createElement('div');
                        menuItem.classList.add('menu-item');

                        const menuName = item.menuName || 'Unknown';
                        const menuPrice = item.menuPrice || 'N/A';
                        const menuImage = item.menuImage ? `<img src="${item.menuImage}" alt="${menuName}" />` : '<img src="placeholder.jpg" alt="No Image" />';

                        menuItem.innerHTML = `
                            ${menuImage}
                            <p>${menuName}</p>
                            <p class="price">${menuPrice}฿</p>
                        `;

                        menuItem.addEventListener('click', () => {
                            showMenuDetail(menuName, menuPrice, item.menuID);
                        });

                        menuList.appendChild(menuItem);
                    });
                } else {
                    console.error("Invalid data format: ", data);
                }
            })
            .catch(error => console.error('Error fetching menu:', error));
    };

    loadMenu();
});
