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

const contributorSchema = new Schema({
  user: {
    type: String
    //type: Schema.Types.ObjectId,
    //ref: 'Users'
  },
  role: String,
  responsibilities: String
});

const projectSchema = new Schema({
  media: [Schema.Types.Mixed],
  cover: Schema.Types.Mixed,
  created: {
    type: Date,
    default: new Date
  },
  contributors: [contributorSchema],
  likes: Number,
  category: {
    type: String,
    enum: ['web', 'mobile', 'hybrid'],
    default: 'web'
  },
  description: String,
  comments: [commentSchema],
  tags: [String],
  projectName: {
    type: String,
    required: true
  },
  /*progress: {
    type: Number,
    default: 0
  },*/
  createdBy: {
    type: String
    //type: Schema.Types.ObjectId,
    //ref: 'User'
  },
  live: {
    type: Boolean,
    default: false
  }
});

/*
projectSchema.pre('save', function(next) {
  let progress = 0;
  if (this.media) progress += 25;
  if (this.contributors.length > 0) progress += 10;
  if (this.description.length > 15) progress += 45;
  if (this.projectName) progress += 5;
  if (this.tags.length > 0) progress += 5;
  if (this.cover) progress += 10;
  this.progress = progress;
  next();
});
*/
module.exports = mongoose.model('Projects', projectSchema);