module.exports = app => {
  const blankRoute = (req, res) => res.json({ test: 'If you see this that the server is working, but you have not specified a route'});

  app.use('/user', require('../api/user'));
  app.use('/project', require('../api/projects'));

  app.get('*', blankRoute);
}