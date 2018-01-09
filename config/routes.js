const User = require('./user/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stuff = require('./config');


const STATUS_USER_ERROR = 422;
const hash = 11;

module.exports = app => {
  const blankRoute = (req,res) => res.json({ test: `You have reached a route that has not been defined. Perhaps you typed something in wrong.` });

  // TODO: Create route that goes to the users App
  app.post('/createUser', (req, res) => {
    let { username, email, password, question } = req.body;
    if (!username || !password) return res.status(400).send({ message: 'Nothing in input field'});
    bcrypt.hash(password, hash, (err, hash) => {
      password = hash;
      const newUser = new User({ username, password, email, question });
      newUser.save((err, data) => {
        if (err || !data) return res.status(400).send({ message: 'Username is taken' });
        res.json(data);
        return
      });
    });
  });

  app.post('/userLogin', (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username })
      .then(user => {
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err || valid === false) return res.status(400).json({ error : 'incorrect password' });
        });
        stuff.token = jwt.sign({ user }, stuff.secret);
        return res.json({ success: 'yes' });
      })
      .catch(err => {
        if (err) return res.status(STATUS_USER_ERROR).json(err.message);
      });
    });

  const middleWare = (req, res, next) => {
    jwt.verify(stuff.token, stuff.secret, (err, decode) => {
      if (err || decode === undefined) {
        return res.json({ Success: 'not logged in'});
      }
      req.user = decode;
    });
    next();
  }

  app.get('/home', middleWare, (req, res) => {
    res.json(req.user);
  });
  
  app.put('/resetPassword', (req, res) => {
    const { username, question, password } = req.body;
    User.findOne({ username: username }, (err, data) => {
      if (data.question !== question) return res.status(400).send({ message: 'invalid quesiton'});
      if (err || !data) res.status(400).send('Unable to change password');
      bcrypt.hash(password, hash, (err, hashedPassword) => {
        data.password = hashedPassword;
      data.save();
      res.json(data);
      });
    });
  });
  // TODO: Create route that goes to the projects App

  app.use('*', blankRoute);
}  

