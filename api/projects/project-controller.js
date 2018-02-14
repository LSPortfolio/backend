const Project = require('./project-model');
const User = require('../user/user-model');

const handleErr = (res, status, message, data) => {
  return status === 500 ? res.status(500).send({ message: 'Server error with this operation.' }) : res.status(status).send({ message });
}


module.exports = {
  single: (req, res) => {
    const { id } = req.params;
    Project.findById(id)
      .then(project => project ? res.json(project) : handleErr(res, 500, 'server error'), e => handleError(res, 403, 'there is no project'));
  },

  all: (req, res) => {
    Project.find().then(projects => projects.length > 0 ? res.json(projects) : handleErr(res, 500, 'server error'), e => handleError(res, 403, 'there is no projects'));
  },

  deleteProject: (req, res) => {
    const { authId } = req.body;
    Project.findById(req.params.id, (err, data) => {
      if (createdBy !== authId) return handleErr(res, 403, 'Unauthorized access, you can\'t delete someone\'s else\'s work');
      Project.findByIdAndRemove(data._id, (err, result) => err ? handleErr(res, 500) : res.json(data));
    });
  },
  addComment: (req, res) => {
    Project.findByIdAndUpdate(req.params.id,
      { $push: { comments: req.body.comment }},
      { new: true, safe: true, upsert: true},
      (err, response) => {
        if (err) return handleErr(res, 500);
        res.json({ message: 'Success, message' })
      });
  },

  removeComment: (req, res) => {
    Project.findOne(req.params.id, (err, project) => {
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

  editComment: (req, res) => {
  },
  // When users search by tags, or click on a tag.

  tagSearch: (req, res) => {
    const { tags } = req.query;
    Project.find({ tags })
      .then(data => res.json(data)).catch(err => res.status(400).json({ message: 'Nothing found with that tag' }));
  },
  
  create: (req, res) => {
    const { projectName, contributors, categoryIndex, tags, description, createdBy, cover, media, github } = req.body;
    //const selection = Project.schema.path('category').enumValues;
    const newProject = new Project();
    newProject.projectName = projectName;
    newProject.media = media;
    newProject.contributors = contributors;
    //newProject.category = selection[categoryIndex];
    newProject.description = description;
    newProject.tags = tags;
    //newProject.createdBy = createdBy;
    newProject.github = github;
    newProject.save((err, data) => {
      if (err) return handleErr(res, 403, 'There was an error creating a new project');
      res.send({ message: 'success', sent: data._id });
    });
  },
}