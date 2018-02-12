module.exports = app => {
  const blankRoute = (req, res) => res.json({ test: 'If you see this that the server is not working, but you have not specified a route'});
  app.get('/helloThere', (req, res) => {
    res.json(process.env.DATABASE);
  });

  app.use('/user', require('../api/user'));
  app.use('/project', require('../api/projects'));

  app.get('*', blankRoute);
}