const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/university', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.once('connected', () => {
    console.log('Connected to MongoDB');
});

db.on('error', console.error.bind(console, 'connection error:'));

