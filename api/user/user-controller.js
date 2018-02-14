const User = require('./user-model');
const bcrypt = require('bcrypt');
const crypto = require('crypto-js');
const jwt = require('jsonwebtoken');
const { handleErr, format, isLoggedIn, sendEmail } = require('../util/index');

module.exports = {
  createUser: (req, res) => {
    const { username, password, email, firstname, lastname, role } = req.body;
    if (!username || !password || !email) return handleErr(res, 411, 'How did you get this far? You must enter the required fields');
    const fullname = format(firstname, lastname);
    const selection = User.schema.path('role').enumValues;
    User.find({$or: [{ email }, { username }]}, (err, user) => {
      if (err) {
        return handleErr(res, 503, 'Please try again later, we could not verify if this accound already exists');
      }
      if (user.length > 0) {
        let type = user[0].email === email ? 'email address' : 'username'
        return handleErr(res, 409, `A user already exists with this ${type}`);
      }
      bcrypt.hash(password, 11, (err, passwordHashed) => {
        if (err) return handleErr(res, 503, 'could not encrypt the password');
        if (!passwordHashed) return handleErr(res, 503, 'could not encrypt the password');
        const newUser = new User();
        newUser.username = username;
        newUser.password = passwordHashed;
        newUser.email = email;
        newUser.fullname = fullname;
        newUser.role = selection[role];
        newUser.save()
        const payload = {
          iss: 'Lambda_Showcase',
          role: newUser.role,
          id: newUser._id,
          permitted: newUser.role !== 'user' ? true : false,
        }
        sendEmail.welcome(newUser.email);
        const token = jwt.sign(payload, process.env.SECRET);
        user = newUser;
        res.status(200).json({ success: 'Registration successful!', token, user });
      });
    });
  },

  login: (req, res) => {
    const { username, password } = req.body;
    const failed = 'Incorrect username or password';
    User.findOne({ username: username })
      .then((user) => {
        if (!user) return handleErr(res, 401, failed);
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err || valid === false) return handleErr(res, 401, failed);
          const payload = {
            iss: 'Lambda_Showcase',
            role: user.role,
            id: user._id,
            permitted: user.role !== 'user' ? true : false,
          }
          const token = jwt.sign(payload, process.env.SECRET);
          res.status(200).json({ message: 'Login successful!', token, user });
        });
      })
      .catch((err) => {
        if (err) return handleErr(res, 500, 'Server error');
      });
  },

  forgotPassword: (req, res) => {           
    const { email } = req.body;
    User.findOne({ email }, (err, user) => {
      if (err) return handleErr(res, 500, 'Server error, could not retrieve account details');
      if (!user) return handleErr(res, 403, 'Could not find user with that email address');
      const token = crypto.AES.encrypt('This is a token!', '29948fjwn3j');
      if (!token) return handleErr(res, 500, 'Server error creating a reset token');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000;
      user.save();
      sendEmail.forgotPassword(user.email, token);
      res.status(200).send({ message: 'Success' });
    });                            
  },

  resetPassword: (req, res) => {                                              //Reset Password after receiving the forgotten password email
    const { token } = req.query;                          
    const { password } = req.body;
    User.findOne({ resetPasswordToken: token }, (err, data) => {
      if (err || !data) res.status(400).send('Invalid username, so you are unable to change password');
      bcrypt.hash(password, hash, (err, hashedPassword) => {
        data.password = hashedPassword;
        data.save();
        sendEmail.pwResetSuccess(data.email)
        res.status(200).res.json({ message: 'Success' });
      });
    });
},

  find: (req, res) => {
    const { data } = req.body;
    User.findOne({ $or: [{ username: data }, { email: data }]}, (err, foundData) => {
      if (err) return handleErr(res, 404, 'server error');
      if (!foundData) return handleErr(res, 403, 'Could not find user');
      res.status(200).json(foundData);
    })
  },

}