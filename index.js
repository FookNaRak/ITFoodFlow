const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./public/itfoodflow.db');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Redirect root URL to TRest.html
app.get('/', (req, res) => {
    res.redirect('/restaurant'); // Redirect to TRest.html
});

// Route to serve cart.html
app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Route to serve payment.html
app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// Route to serve TRest.html
app.get('/restaurant', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'TRestHt.html')); // Ensure this matches your file name
});

// Route to serve confirmation.html
app.get('/confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

// API to retrieve cart items
app.get('/cart-items', (req, res) => {
    db.all('SELECT c.menuID, c.quantity, c.note, m.menuName, m.menuPrice, m.menuImage FROM cart c JOIN menu m ON c.menuID = m.menuID', [], (err, rows) => {
        if (err) {
            console.error("Database Error: ", err.message);
            res.status(400).json({ "error": err.message });
            return;
        }

        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Route to get all info from the cart table
app.get('/all-cart-info', (req, res) => {
    const query = 'SELECT * FROM cart'; // This retrieves all records from the 'cart' table
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Database Error: ", err.message);
            res.status(400).json({ "error": err.message });
            return;
        }

        console.log("Cart table information retrieved: ", rows);
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Route to get menu items
app.get('/menu-items', (req, res) => {
    db.all('SELECT menuName, menuPrice, menuID, menuImage FROM menu WHERE shopID = 1', [], (err, rows) => {
        if (err) {
            console.error("Database Error: ", err.message);
            res.status(400).json({ "error": err.message });
            return;
        }

        const menuItems = rows.map(row => {
            const base64Image = row.menuImage ? Buffer.from(row.menuImage).toString('base64') : null;
            return {
                menuID: row.menuID,
                menuName: row.menuName,
                menuPrice: row.menuPrice,
                menuImage: base64Image ? `data:image/png;base64,${base64Image}` : null
            };
        });

        res.json({
            "message": "success",
            "data": menuItems
        });
    });
});

// API to add item to the cart
app.post('/add-to-cart', (req, res) => {
    const { menuID, userID, quantity, note } = req.body;

    db.get('SELECT * FROM cart WHERE menuID = ? AND userID = ?', [menuID, userID], (err, row) => {
        if (err) {
            console.error("Database Error: ", err.message);
            res.status(400).json({ "error": err.message });
            return;
        }

        if (row) {
            db.run('UPDATE cart SET quantity = quantity + ?, note = COALESCE(?, note) WHERE menuID = ? AND userID = ?', [quantity, note, menuID, userID], function (err) {
                if (err) {
                    console.error("Database Error: ", err.message);
                    res.status(400).json({ "error": err.message });
                    return;
                }

                res.json({ "message": "Cart updated successfully" });
            });
        } else {
            db.run('INSERT INTO cart (menuID, userID, quantity, note) VALUES (?, ?, ?, ?)', [menuID, userID, quantity, note], function (err) {
                if (err) {
                    console.error("Database Error: ", err.message);
                    res.status(400).json({ "error": err.message });
                    return;
                }

                res.json({ "message": "Item added to cart successfully", "cartID": this.lastID });
            });
        }
    });
});

// API to delete menu item from cart
app.delete('/menu/:menuID', (req, res) => {
    const { menuID } = req.params;

    db.run('DELETE FROM cart WHERE menuID = ?', [menuID], function (err) {
        if (err) {
            console.error("Database Error: ", err.message);
            res.status(400).json({ "error": err.message });
            return;
        }

        res.json({ "message": "Item deleted successfully" });
    });
});

// Start the server
const port = 5000;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
