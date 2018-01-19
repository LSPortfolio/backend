const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },
  text: String,
  created: {
    type: Date,
    default: new Date
  }
})

const projectSchema = new Schema({
  media: Schema.Types.Mixed,
  created: {
    type: Date,
    default: new Date
  },
  contributors: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
      },
      role: String,
      responsibilities: String
    }
  ],
  likes: Number,
  category: {
    type: String,
    enum: ['web', 'mobile', 'hybrid'],
    default: 'web'
  },
  description: String,
  comments: [commentSchema],
  tags: [String],
  name: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Projects', projectSchema);