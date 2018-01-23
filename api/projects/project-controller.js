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
  addComment: (req, res) => {
    Project.findByIdAndUpdate(req.params.id,
      { $set: { comments: req.body.comment }},
      { new: true, safe: true, upsert: true},
      (err, response) => {
        if (err) return handleErr(res, 500);
      });
  },
  removeComment: (req, res) => {
    Project.findOne(req.params.project, (err,project) => {
      if (err) return handleErr(res, 500);
      if (!project) return handleErr(res, 404, 'This project cannot be found.');
      for (let i = 0; i < project.comments.length; i++) {
        if (project.comments[i]._id === req.params.commentId) {
          if (project.comments[i].author !== req.userId && req.role !== 'admin') return handleErr(res, 403, 'You are not authorized to remove this comment');
          project.comments.splice(i,1);
        }
      }
      project.save((error, updated) => {
        if (error) return handleErr(res, 500);
        res.json(updated);
      })
    })
  },
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
    Project.findByIdAndUpdate(req.params.id,
      { $set: { live: false }},
      { new: true, safe: true, upsert: true },
      (err, response) => {
        if (err) return handleErr(res, 500);
        res.json(response);
      });
  },
  addMedia: (req, res) => {
    Project.findByIdAndUpdate(req.params.id,
      { $push: { media: req.body.media }},
      { safe: true, new: true, upsert: true },
      (err, response) => {
        if (err) return handleErr(res, 500);
        res.json(response);
      });
  },
  removeMedia: (req, res) => {
    Project.findByIdAndUpdate(req.params.projectId, 
      { $pull: { media: { _id: req.params.mediaId }}},
      { new: true, safe: true, upsert: true },
      (err, response) => {
        if (err) return handleErr(res,500);
        res.json(response);
      });
  },
  updateCover: (req, res) => {},
  updateCategory: (req, res) => {},
  updateDescription: (req, res) => {
    Project.findByIdAndUpdate(req.params.id,
      { $set: { description: req.body.description }},
      { new: true, upsert: true, safe: true },
      (err, response) => {
        if (err) return handleErr(res, 500);
        res.json(response);
      })
  },
  updateName: (req, res) => {
    Project.findByIdAndUpdate(req.params.id,
      { $set: { projectName: req.body.projectName }},
      { new: true, safe: true, upsert: true },
      (err, response) => {
        if (err) return handleErr(res, 500);
        res.json(response);
      });
  },
  addContributor: (req, res) => {
    Project.findByIdAndUpdate(req.params.id,
      { $push: { contributors: req.body.contributor }},
      { new: true, safe: true, upsert: true },
      (err, response) => {
        if (err) return handleErr(res, 500);
        res.json(response);
      });
  },
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
  deleteProject: (req, res) => Project.findByIdAndRemove(req.params.id, (err, response) => err ? handleErr(res, 500) : res.json(response)),
}