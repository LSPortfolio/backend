const User = require('./userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const container = require('../../config/config');
const functions = require('./functions');

const hash = 11;

module.exports = {

  createUser: (req, res) => {                                                   //Create user
    let { username, password, answer, email, firstname, lastname, role } = req.body;
    fullname = `${firstname} ${lastname}`;    //put logic caps first letter of first and last name;
    if (!username || !password) return res.status(400).send({ message: 'Nothing in input field' });
    bcrypt.hash(password, hash, (err, hash) => {
      password = hash;
      const newUser = new User({ username, password, answer, email, fullname, role });
      newUser.save((err, data) => {
        if (err || !data) return res.status(400).send({ message: 'Username is taken' });    
        functions.mail(res, email, 'Welcome to showcase', 'confirm user');    //Automatically sends user email that they've signed in        
        functions.airTable(res, fullname, role);  //Sends user info to airtable if they are staff or not
        res.json({ message: 'Success' });
      });
    });
  },

  userLogin: (req, res) => {                                                  //Standard user login
    const { username, password } = req.body;
    User.findOne({ username: username })
      .then((user) => {
        if (!user) return res.status(400).json({ error : 'incorrect username' });
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err || valid === false) return res.status(400).json({ error : 'incorrect password' });
          const token = jwt.sign({ user }, container.secret);               //Will update soon
          res.json({ success: 'yes', jtwToken: token });
        });
      })
      .catch((err) => {
        if (err) return res.status(400).json(err.message);
      });
  },

  forgotPassword: (req, res) => {                                             //Forgot password Part
    const { email, answer } = req.body;
    User.findOne({ email: email })
      .then((data) => {
        if (!data || answer !== data.answer) res.status(400).send({ message: 'incorrect input' });
        const token = jwt.sign({ data: data.username }, container.secret);
        functions.mail(res, data.email, 'Reset Password Lambda Showcase', 'Reset password?');         //will update soon, put token in 4th parameter
        res.json({ message: 'success', temporaryToken: token });
      })
      .catch((err) => {
        if (err) res.status(400).json({ message: 'You have input the incorrect Email' });
      })
  },

  resetPassword: (req, res) => {                                              //Reset Password after receiving the forgotten password email
    const { token } = req.params;                          
    const { answer, password } = req.body;
    const decoded = jwt.verify(token, container.secret);
    User.findOne({ username: decoded.data }, (err, data) => {
      if (data.answer !== answer) return res.status(400).send({ message: 'invalid question' });
      if (err || !data) res.status(400).send('Invalid username, so you are unable to change password');
      bcrypt.hash(password, hash, (err, hashedPassword) => {
        data.password = hashedPassword;
        data.save();
        functions.mail(res, data.email, 'You have changed your password', 'if you did not do this please click this link');     //will update soon
        res.json({ message: 'success' });
      });
    });
  }
}
