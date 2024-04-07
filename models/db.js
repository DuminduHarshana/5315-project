const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    date: Date,
    grade: String,
    score: Number
});

const addressSchema = new mongoose.Schema({
    building: String,
    coord: {
        type: [Number],
        index: '2dsphere'
    },
    street: String,
    zipcode: String
});

const restaurantSchema = new mongoose.Schema({
    address: addressSchema,
    borough: String,
    cuisine: String,
    grades: [gradeSchema]
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

async function initialize(connectionString) {
    try {
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        throw err;
    }
}

async function addNewRestaurant(data) {
    try {
        const restaurant = new Restaurant(data);
        await restaurant.save();
        console.log('New restaurant added:', restaurant);
        return restaurant;
    } catch (error) {
        console.error('Error adding new restaurant:', error);
        throw error;
    }
}

async function getAllRestaurants(page, perPage, borough) {
    try {
        let query = Restaurant.find();
        if (borough) {
            query = query.where('borough').equals(borough);
        }
        const restaurants = await query
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort('restaurant_id');
        return restaurants;
    } catch (error) {
        console.error('Error getting restaurants:', error);
        throw error;
    }
}

async function getRestaurantById(id) {
    try {
        const restaurant = await Restaurant.findById(id);
        return restaurant;
    } catch (error) {
        console.error('Error getting restaurant by ID:', error);
        throw error;
    }
}

async function updateRestaurantById(data, id) {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(id, data, { new: true });
        return restaurant;
    } catch (error) {
        console.error('Error updating restaurant by ID:', error);
        throw error;
    }
}

async function deleteRestaurantById(id) {
    try {
        await Restaurant.findByIdAndDelete(id);
        console.log('Restaurant deleted successfully');
    } catch (error) {
        console.error('Error deleting restaurant by ID:', error);
        throw error;
    }
}

module.exports = {
    initialize,
    addNewRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurantById,
    deleteRestaurantById
};
