const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// ตั้งค่า multer สำหรับการอัปโหลดไฟล์ในระบบไฟล์
const storage = multer.memoryStorage(); // เก็บไฟล์ในหน่วยความจำเพื่อใช้ในฐานข้อมูล BLOB
const upload = multer({ storage: storage });

// สร้างหรือเปิดฐานข้อมูล SQLite
const db = new sqlite3.Database("./itfoodflow.db");

// สร้างตารางถ้ายังไม่มี
db.run(`CREATE TABLE IF NOT EXISTS menu (
    menuID INTEGER PRIMARY KEY AUTOINCREMENT,
    shopID INTEGER,
    menuName TEXT,
    menuPrice REAL,
    image BLOB
)`);

db.run(`CREATE TABLE IF NOT EXISTS \`order\` (
    orderID INTEGER PRIMARY KEY AUTOINCREMENT,
    menuID INTEGER,
    shopID INTEGER,
    orderTime TEXT,
    userID INTEGER,
    FOREIGN KEY (menuID) REFERENCES menu (menuID)
)`);

// สร้างตาราง shop สำหรับการลงทะเบียนร้านค้า
db.run(`CREATE TABLE IF NOT EXISTS shop (
    shopID INTEGER PRIMARY KEY AUTOINCREMENT,
    shopName TEXT,
    shopOwnerName TEXT,
    shopEmail TEXT,
    phone TEXT,
    password TEXT,
    profileImage BLOB,
    userID INTEGER,
    FOREIGN KEY (userID) REFERENCES userAccount(userID)
);

)`);

// เสิร์ฟไฟล์ static จากโฟลเดอร์ 'public'
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // สำหรับรับข้อมูล JSON
app.use(express.urlencoded({ extended: true })); // สำหรับรับข้อมูลจากฟอร์ม HTML

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// API เพื่อเพิ่มรายการเมนูพร้อมอัปโหลดรูปภาพ
app.post("/api/menu", upload.single("image"), (req, res) => {
  const { shopID, menuName, menuPrice } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;

  // บันทึกข้อมูลเมนูพร้อมรูปภาพ (BLOB) ลงในฐานข้อมูล
  db.run(
    `INSERT INTO menu (shopID, menuName, menuPrice, image) VALUES (?, ?, ?, ?)`,
    [shopID, menuName, menuPrice, imageBuffer],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ menuID: this.lastID });
    }
  );
});

// API เพื่อดึงข้อมูลเมนูทั้งหมด
app.get("/api/menu", (req, res) => {
  db.all(
    `SELECT menuID, shopID, menuName, menuPrice FROM menu`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// API เพื่อดึงข้อมูลเมนูตาม menuID
app.get("/api/menu/:menuID", (req, res) => {
  const menuID = req.params.menuID;
  db.get(
    `SELECT menuID, shopID, menuName, menuPrice FROM menu WHERE menuID = ?`,
    [menuID],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: "Menu not found" });
      }
      res.json(row);
    }
  );
});

// API เพื่อดึงรูปภาพจากฐานข้อมูล
app.get("/api/menu/:id/image", (req, res) => {
  const menuID = req.params.id;

  db.get(`SELECT image FROM menu WHERE menuID = ?`, [menuID], (err, row) => {
    if (err || !row || !row.image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // ส่งข้อมูลรูปภาพกลับเป็นไบนารี
    res.setHeader("Content-Type", "image/png");
    res.send(row.image);
  });
});

// API เพื่อลบเมนูตาม menuID
app.delete("/api/menu/:id", (req, res) => {
  const menuID = req.params.id;

  // ลบเมนูจากฐานข้อมูล
  db.run(`DELETE FROM menu WHERE menuID = ?`, [menuID], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: "Menu deleted successfully" });
  });
});

// API เพื่อดึงข้อมูลร้านค้า (shop)
app.get("/api/shops", (req, res) => {
  const query = `SELECT * FROM shop`; // คิวรีดึงข้อมูลจากตาราง shop

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // ส่งข้อมูลร้านค้ากลับไปยัง client
  });
});

// Route เพื่อดึงข้อมูลร้านอาหารจากฐานข้อมูล
app.get("/api/restaurants", (req, res) => {
  const query = `SELECT * FROM restaurants`; // คิวรีดึงข้อมูลร้านอาหาร

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // ส่งข้อมูลร้านอาหารกลับไปยัง client
  });
});

// Route เพื่อดึงรายการ order ตาม userID
app.get("/api/orders/:userID", (req, res) => {
  const userID = req.params.userID;

  const query = `SELECT orderID, menuID, shopID, orderTime, userID 
                   FROM \`order\` 
                   WHERE userID = ?`;

  db.all(query, [userID], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    console.log(rows); // พิมพ์ข้อมูลคำสั่งซื้อทั้งหมดเพื่อดูผลลัพธ์
    res.json(rows); // ส่งข้อมูลคำสั่งซื้อทั้งหมดกลับไปยัง client
  });
});

// API สำหรับการลงทะเบียนร้านค้าพร้อมอัปโหลดรูปภาพ
app.post("/signup", upload.single("shopPicture"), (req, res) => {
  const {
    shopName,
    shopOwnerFirstName,
    shopOwnerLastName,
    shopEmail,
    shopOwnerTel,
    password,
  } = req.body;
  const shopPicture = req.file ? req.file.buffer : null;

  const shopOwnerName = `${shopOwnerFirstName} ${shopOwnerLastName}`;
  const role = "Shop Owner"; // กำหนด role เป็น Shop Owner

  // บันทึกข้อมูลในตาราง useraccount ก่อน
  db.run(
    `INSERT INTO useraccount (username, password, email, role) VALUES (?, ?, ?, ?)`,
    [`${shopOwnerFirstName}.${shopOwnerLastName}`, password, shopEmail, role],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const userID = this.lastID; // รับ userID ของผู้ใช้ที่เพิ่งสร้าง

      // บันทึกข้อมูลร้านค้าพร้อม userID และรูปภาพโปรไฟล์ (BLOB) ลงในฐานข้อมูล
      db.run(
        `INSERT INTO shop (shopName, shopOwnerName, shopEmail, shopOwnerTel, shopPicture, userID) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
        [shopName, shopOwnerName, shopEmail, shopOwnerTel, shopPicture, userID],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ shopID: this.lastID });
        }
      );
    }
  );
});

// sign in customer
app.post("/signup/customer", (req, res) => {
  const { customerFirstName, customerLastName, email, password } = req.body;

  const customerName = `${customerFirstName} ${customerLastName}`;
  const role = "Customer"; // กำหนด role เป็น Customer

  // บันทึกข้อมูลลูกค้าในตาราง useraccount
  db.run(
    `INSERT INTO useraccount (username, password, email, role) VALUES (?, ?, ?, ?)`,
    [`${customerFirstName}.${customerLastName}`, password, email, role],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ userID: this.lastID });
    }
  );
});

app.get('/api/tracking/:userID', (req, res) => {
    const userID = req.params.userID;

    // Query to get all orders for the given userID and join with menu
    const query = `
        SELECT o.orderID, m.menuName AS menuItem, m.menuPrice AS price,
               (SELECT COUNT(*) FROM \`order\` WHERE orderID < o.orderID) AS queue,
               CASE WHEN o.orderID = (SELECT MAX(orderID) FROM \`order\` WHERE userID = ?) THEN 'completed' ELSE 'in queue' END AS status
        FROM \`order\` o
        JOIN menu m ON o.menuID = m.menuID
        WHERE o.userID = ?
        ORDER BY o.orderID ASC`;

    db.all(query, [userID, userID], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log(rows); // Check what data is returned
        res.json(rows);  // Send data to client
    });
});


// รันเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
