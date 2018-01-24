const User = require('./userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const container = require('../../config/config');
const functions = require('./functions');

module.exports = {

  createUser: (req, res) => {
    const { username, password, question, answer, email, firstname, lastname, role } = req.body;
    const fullname = functions.formatName(firstname, lastname);
    if (!username || !password) return res.status(400).send('Please enter valid Username or Password');
    bcrypt.hash(password, 11, (err, hash) => {
      let hashedPassword = hash;
      const newUser = new User({ username, password: hashedPassword, question, answer, email, fullname, role });
      newUser.save((err, data) => {
        if (err || !data) return res.status(400).send('Username is already taken!');
        functions.mail(res, email, 'Welcome to showcase', 'confirm user');
        functions.airTable(res, fullname, role);
        const token = jwt.sign({ user: newUser }, container.secret);
        console.log(token)
        res.status(200).json({ success: 'Registration successful!', token });
      });
    });
  },

  userLogin: (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username })
      .then((user) => {
        if (!user) return res.status(400).send('Incorrect Username or Password');
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err || valid === false) return res.status(400).send('Incorrect Username or Password');
          const token = jwt.sign({ user }, container.secret);
          res.status(200).json({ message: 'Login successful!', token });
        });
      })
      .catch((err) => {
        if (err) return res.status(400).send('Incorrect Username or Password');
      });
  },

  forgotPassword: (req, res) => {
    const { email, answer } = req.body;
    User.findOne({ email: email })
      .then((data) => {
        if (!data || answer !== data.answer) res.status(400).send({ message: 'incorrect input' });
        const token = jwt.sign({ data: data.username }, container.secret);
        // Will update soon, put token in 4th parameter
        functions.mail(res, data.email, 'Reset Password Lambda Showcase', 'Reset password?');
        res.json({ message: 'success', temporaryToken: token });
      })
      .catch((err) => {
        if (err) res.status(400).json({ message: 'You have input the incorrect Email' });
      })
  },

  // Reset Password after receiving the forgotten password email
  resetPassword: (req, res) => {
    const { token } = req.params;
    const { answer, password } = req.body;
    const decoded = jwt.verify(token, container.secret);
    User.findOne({ username: decoded.data }, (err, data) => {
      if (data.answer !== answer) return res.status(400).send({ message: 'invalid question' });
      if (err || !data) res.status(400).send('Invalid username, so you are unable to change password');
      bcrypt.hash(password, hash, (err, hashedPassword) => {
        data.password = hashedPassword;
        data.save();
        // Will update soon
        functions.mail(res, data.email, 'You have changed your password', 'if you did not do this please click this link');
        res.json({ message: 'success' });
      });
    });
  }
}
