const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 80;

// MongoDB connection
async function connectToMongoDB() {
    const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/amazon";
    try {
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Connected successfully to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1); // Exit if the database connection fails
    }
}
connectToMongoDB();

// Mongoose Schema and Model
const amazonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const Amazon = mongoose.model("Amazon", amazonSchema);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "../public/index.html");
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("❌ Error sending index.html:", err);
            res.status(500).send("Error loading the page.");
        }
    });
});

app.get("/register", (req, res) => {
    const filePath = path.join(__dirname, "../public/register.html");
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("❌ Error sending register.html:", err);
            res.status(500).send("Error loading the page.");
        }
    });
});
app.get("/login", (req, res) => {
    const filePath = path.join(__dirname, "../public/login.html");
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("❌ Error sending login.html:", err);
            res.status(500).send("Error loading the page.");
        }
    });
});
app.post("/register", async (req, res) => {
    console.log("🟡 Incoming request body:", req.body);

    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            console.error("❌ Validation Error: Missing fields");
            return res.status(400).send("All fields are required.");
        }

        // Check if email already exists
        const existingUser = await Amazon.findOne({ email });
        if (existingUser) {
            console.error("❌ Duplicate email error:", email);
            return res.status(400).send("Email already exists.");
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user data
        const registerData = new Amazon({ name, email, password: hashedPassword });
        await registerData.save();
        console.log("✅ User registered successfully:", { name, email });

        res.status(201).send("Thanks for registering.");
    } catch (error) {
        console.error("❌ Error saving data:", error);
        res.status(500).send("An error occurred, please try again later.");
    }
});
app.post("/login", async (req, res) => {
    console.log("🟡 Incoming request body:", req.body);

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Email and password are required.");
        }

        const existingUser = await Amazon.findOne({ email });
        if (!existingUser) {
            return res.status(404).send("User not found. Please register first.");
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).send("Incorrect email or password.");
        }

        console.log("✅ Login successful for:", email);
        return res.status(200).send("Thanks for logging in!");

    } catch (error) {
        console.error("❌ An error occurred during login:", error);
        res.status(500).send("An error occurred, please try again later.");
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
