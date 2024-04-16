const express = require('express');
const mongoose = require('mongoose');
const { engine } =require('express-handlebars');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const db = require('./models/db');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const app = express();

app.engine('.hbs', engine({ extname:'.hbs' }));
app.set('view engine', '.hbs');
const connectionString = process.env.DB_CONNECTION_STRING;
const jwt2=process.env.JWT_SECRET;
// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static('public'));

db.initialize(connectionString);
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
// Render registration form
app.get('/register', (req, res) => {
    res.render('register');
});

// Render login form
app.get('/login', (req, res) => {
    res.render('login');
});


const registerUser = async (req, res) => {
    try {
        const uri = connectionString;
        const dbName = '5315-project';
    if (!req.body.password || typeof req.body.password !== 'string') {
        return res.status(400).send('Invalid password format.');
    }
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    // Select the database
    const db2 = client.db(dbName);
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create the user document
    const newUser = {
        username: req.body.username,
        password: hashedPassword
    };

    // Insert the user document into the 'users' collection
    await db2.collection('users').insertOne(newUser);

    // Close the MongoDB connection
    await client.close();

    // Redirect to the login page after successful registration
    res.status(201).redirect('/login');
} catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}
};

// Async function to handle login
const loginUser = async (req, res) => {
    try{
        const uri = connectionString;
        const dbName = '5315-project';
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    // Select the database
    const db2 = client.db(dbName);
    const user = await db2.collection('users').findOne({ username: req.body.username });

        // Check if user exists
        if (!user) {
            return res.status(404).send('User not found.');
        }

        // Compare the provided password with the hashed password stored in the user document
        const validPassword = await bcrypt.compare(req.body.password, user.password);

        // Check if password is valid
        if (!validPassword) {
            return res.status(400).send('Invalid password.');
            
        
        }
        res.status(200).redirect('/');

        // Close the MongoDB connection
        await client.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
// Validation middleware for GET /api/restaurants route
const getRestaurantsValidator = [
    check('page').isInt().toInt(),
    check('perPage').isInt().toInt(),
    check('borough').optional().isString()
];

// POST /api/restaurants
app.post('/api/restaurants', async (req, res) => {
    try {
        const restaurant = await db.addNewRestaurant(req.body);
        res.status(201).json(restaurant);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/restaurants
app.get('/api/restaurants',getRestaurantsValidator, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const page = req.query.page || 1;
        const perPage = req.query.perPage || 5;
        const borough = req.query.borough;

        const restaurants = await db.getAllRestaurants(page, perPage, borough);
        res.json(restaurants);
    } catch (error) {
        console.error('Error getting restaurants:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/restaurants/:id
app.get('/api/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await db.getRestaurantById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error) {
        console.error('Error getting restaurant by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/restaurants/:id
app.put('/api/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await db.updateRestaurantById(req.body, req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error) {
        console.error('Error updating restaurant by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/restaurants/:id
app.delete('/api/restaurants/:id', async (req, res) => {
    try {
        await db.deleteRestaurantById(req.params.id);
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
        console.error('Error deleting restaurant by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET route for rendering form and results using Handlebars
app.get('/', async (req, res) => {
    try {
        // If form is submitted
        if (req.query.page && req.query.perPage && req.query.borough) {
            const page = parseInt(req.query.page);
            const perPage = parseInt(req.query.perPage);
            const borough = req.query.borough;
            const restaurants = await db.getAllRestaurants(page, perPage, borough);
            res.render('index', { restaurants });
        } else {
            // Render only form
            res.render('index');
        }
    } catch (error) {
        console.error('Error rendering page:', error);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
