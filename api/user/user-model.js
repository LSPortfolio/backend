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
    fullame: String,
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
        enum: ['admin', 'user', 'permitted'],
        default: 'user'
    },
    staff: {
        type: Boolean,
        default: 'false'
    },
    social: [{
        site: {
            type: String,
            enum: ['fb', 'tw', 'li']
        },
        link: String
    }],
    skills: [String],
    resume: String,
    project_drafts: [{
        type: Schema.Types.ObjectId,
        ref: 'Projects'
    }],
    created: {
        type: Date,
        default: new Date()
    },
    resetPasswordToken: String,
    resetPasswordExpires: {
        type: Date,
        default: date.now()
    }
});

userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
}

module.exports = mongoose.model('User', userSchema);