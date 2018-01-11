const sendGrid = require('@sendgrid/mail');
const User = require('./userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const container = require('../../config/config');

const hash = 11;

const mail = (res, email, title, body) => {
  sendGrid.setApiKey(container.sendgridApi);
  let msg = {
    to: email,
    from: 'rolandc5@hotmail.com',
    subject: title,
    text: body,
    html: '<strong>and easy to do anywhere, even with Node.js</strong>'
  }
  sendGrid.send(msg, (err, data) => {
    if (err) res.status(500).json({ message: 'Something went wrong when delivering message' });
  });
  return;
}

module.exports = {

  createUser: (req, res) => {
    let { username, email, password, sAnswer, ladder } = req.body;
    if (!username || !password) return res.status(400).send({ message: 'Nothing in input field'});
    bcrypt.hash(password, hash, (err, hash) => {
      password = hash;
      const newUser = new User({ username, password, email, sAnswer, ladder });
      newUser.save((err, data) => {
        if (err || !data) return res.status(400).send({ message: 'Username is taken' });
        mail(res, email, 'Welcome to showcase', 'confirm user');
        res.json({ message: 'Success' });
      });
    });
  },

  userLogin: (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username })
      .then((user) => {
        if (!user) return res.status(400).json({ error : 'incorrect username' });
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err || valid === false) return res.status(400).json({ error : 'incorrect password' });
          const token = jwt.sign({ user }, container.secret);
          res.json({ success: 'yes', jtwToken: token });
        });
      })
      .catch((err) => {
        if (err) return res.status(400).json(err.message);
      });
  },

  forgotPassword: (req, res) => {
    const { email, sAnswer } = req.body;
    User.findOne({ email: email })
      .then((data) => {
        if (!email || sAnswer !== data.sAnswer) res.status(400).send({ message: 'incorrect input' });
        mail(res, data.email, 'Reset Password Lambda Showcase', 'Reset password?');
        res.json({ message: 'success' });
      })
      .catch((err) => {
        if (err) res.status(400).json({ message: 'You have input the incorrect Email' });
      })
  },

  resetPassword: (req, res) => {
    const { username, sAnswer, password } = req.body;
    User.findOne({ username: username }, (err, data) => {
      if (data.sAnswer !== sAnswer) return res.status(400).send({ message: 'invalid quesiton'});
      if (err || !data) res.status(400).send('Invalid username, so you are unable to change password');
      bcrypt.hash(password, hash, (err, hashedPassword) => {
        data.password = hashedPassword;
      data.save();
      mail(res, data.email, 'You have changed your password', 'if you did not do this please click this link');
      res.json(data);
      });
    });
  }
}
