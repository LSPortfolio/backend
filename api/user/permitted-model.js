const mongoose = require('mongoose');
const { Schema } = mongoose;

const permittedSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    airTableId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Permitted', permittedSchema);