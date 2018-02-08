const async = require('async');
const Project = require('./project-model');
const User = require('../user/user-model');
const { handleErr, sendToCloudinary,  sendEmail } = require('../util');


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

  // The following controllers expect to come from owner of project or admin.
  createDraft: (req, res) => {
    const { projectName, contributors, categoryIndex, tags, description, createdBy, cover, media } = req.body;
    if (!createdBy) return handleErr(res, 403, 'Unauthorized Access, to post projects user needs to be logged in');
    //const selection = Project.schema.path('category').enumValues;
    const newProject = new Project();
    newProject.projectName = projectName;
    newProject.cover = cover;
    //newProject.contributors = contributors;
    //newProject.category = selection[categoryIndex];
    newProject.description = description;
    newProject.tags = tags;
     //newProject.createdBy = createdBy;
    newProject.save((err, data) => {
      if (err) return handleErr(res, 403, 'There was an error creating a new project');
      res.send({ message: 'success', sent: data._id });
    });
  },
  
  makeLive: (req, res) => {
    // make sure the project shows up on contributors' accounts.
    const turnToLive = (done) => {
      Project.findByIdAndUpdate(req.params.id,
        { $set: { live: true }},
        { new: true, safe: true, upsert: true },
        (err, response) => {
          if (response.progress < 80) {
            return handleErr(res, 413, 'Project unable to make live... Project draft has not met the specified requirements');
          }
          if (err) return handleErr(res, 500);
          done(null, response);
      })
    }

    const addProjectToContributors = (projectData, done) => {
      const saveToUserAndEmail = (userToSave, done) => {
        User.findOneAndUpdate(userToSave.user,
          { $push: { finishedProjects: projectData._id } },
          { new: true, safe: true, upsert: true },
          (err, userData) => {
            if (err) return handleErr(res, 500);
            if (!userData) return handleErr(res, 404, `Error updating ${userData.email}`);
            sendEmail.makeLive(userData.email, projectData)
              .then(resolved => done())
              .catch(e => callback({ message: `Error sending email to ${userData.email}` }));
        });
      }
      async.each(projectData.contributors, saveToUserAndEmail, (err) => {
        if (err) return done(err);
        done (null, projectData);
      });

    }

    async.waterfall([
      turnToLive,
      addProjectToContributors
    ], (err, result) => {
      if (err) res.send(err);
      res.json(result);
    });
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

  updateCover: (req, res) => {
    Project.findByIdAndUpdate(req.params.id, 
    { $set: { cover: req.body.cover }},
    { new: true, safe: true, upsert: true },
    (err, response) => {
      if (err) return handleErr(res, 500);
      res.json(reponse);
    });
  },

  updateCategory: (req, res) => {
    const selection = Project.schema.path('category').enumValues;
    Project.findByIdAndUpdate(req.params.id,
      { $set: { category: selection[req.body.index] }},
      { new: true, safe: true, upsert: true },
      (err, response) => {
        if (err) return handleErr(res, 500);
        res.json(response);  
      })
  },

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

  removeContributor: (req, res) => {
    const { index } = req.body;
    Project.findByIdAndUpdate( req.params.id )
      .then(data => {
        data.contributors = data.contributors.filter(item => !index.includes(item.user));
        data.save();
        res.json(data);
      })
      .catch(err => res.status(400).send({ message: 'Could not find' }));
  },

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
