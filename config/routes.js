module.exports = app => {
  const blankRoute = (req,res) => res.json({ test: `You have reached a route that has not been defined. Perhaps you typed something in wrong.` });

<<<<<<< HEAD
  // TODO: Create route that goes to the users App
  app.use('/user', require('../api/user'));
=======
  app.use('/user*', require('../api/user'));
  app.use('/project*', require('../api/projects'));

>>>>>>> Changes from Home PC.
  // TODO: Create route that goes to the projects App

  app.use('*', blankRoute);
}