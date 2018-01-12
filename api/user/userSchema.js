const mongoose = require('mongoose');

const Schema = mongoose.Schema; 

const userSchema = Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    email: {
        type: String
    },
    fullname: String,
    Activity: [String],
    profile: {
        preferred_location: String,
        picture: String,
        subtitle: String,
        location: String,
        bio: String
    },
    role: {
        type: String,
    },
    social: [{
        site: {
            type: String,
            enum: []
        },
        link: String
    }],
    skills: [String],
    resume: String,
});

module.exports = mongoose.model('User', userSchema);