const Project = require('./project-model');


module.exports = {
  single: (req, res) => {
    const { id } = req.params;
    Project.findById(id)
      .then(project => project ? res.json(project) : 'handle errors here', e => 'handle errors here.');
  },
  all: (res, res) => {
    Project.find().then(projects => projects.length > 0 ? res.json(projects) : 'handle errors here', e => 'handle errros here');
  }
}