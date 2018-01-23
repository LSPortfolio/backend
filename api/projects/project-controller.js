const Project = require('./project-model');
const { handleErr } = require('../util');


module.exports = {
  single: (req, res) => {
    const { id } = req.params;
    Project.findById(id)
      .then(project => project ? res.json(project) : 'handle errors here', e => 'handle errors here.');
  },
  all: (res, res) => {
    Project.find().then(projects => projects.length > 0 ? res.json(projects) : 'handle errors here', e => 'handle errros here');
  },
  addComment: (req, res) => {},
  removeComment: (req, res) => {},
  editComment: (req, res) => {},
  // When users search by tags, or click on a tag.
  tagSearch: (req, res) => {},
  // The following controllers expect to come from owner of project or admin.
  createDraft: (req, res) => {},
  makeLive: (req, res) => {
    // make sure the project shows up on contributors' accounts.
  },
  makeHidden: (req, res) => {
    // make sure to account for the fact that the project still shows up on contributors' accounts, remove them.
  },
  addMedia: (req, res) => {},
  removeMedia: (req, res) => {},
  updateCover: (req, res) => {},
  updateCategory: (req, res) => {},
  updateDescription: (req, res) => {},
  updateName: (req, res) => {},
  addContributor: (req, res) => {},
  removeContributor: (req, res) => {},
  saveDraft: (req, res) => {
    Project.findByIdAndUpdate(req.params.id, 
      { $set: req.body.project },
      { new: true, upsert: true, safe: true },
      (err, project) => {
        if (err) return handleErr(res, 503, 'Server error trying to update this project.');
        res.json(project);
      })
  },
  // Admin only controllers.
  deleteProject: () => {},
}