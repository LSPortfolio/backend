const User = require('./user-model');
const bcrypt = require('bcrypt');
const crypto = require('crypto-js');
const jwt = require('jsonwebtoken');
const async = require('async');
const { handleErr, checkAirTableRoles, sendEmail, format } = require('../util');
const hash = 11;
const moment = require('moment');

module.exports = {
  /*=================================================================
  Create User
  =================================================================*/
  createUser: (req, res) => {   
    const error = {}                                              
    let { username, password, email, firstname, lastname, role } = req.body;
    const fullname = format(firstname, lastname);
    const selection = User.schema.path('role').enumValues;
    // This function checks to see if this user already exists, if there is an error, return that, if there is a user, stop, if not, hash the password and create the new user object to be saved later.
    const register = done => {
      const { username, password, email, fullName, role } = req.body;
      User.find({ $or: [{ email }, { username }]}, (err, users) => {
        if (err) {
          error.status = 503;
          error.message = 'Please try again later. We could not verify if this account already exists.'
          return done (error);
        };
        if (users.length > 0) {
          let type = users[0].email === email ? 'email address' : 'username'
          error.status = 409;
          error.message = `A user already exists with this ${type}.`;
          return done(error)
        };
        bcrypt.hash(password, hash, (err, hashed) => {
          if (err) {
            error.status = 503;
            error.message = 'Sorry, we could not encrypt your password. Please try again with a different password.'
            return done(error);
          }
          const newUser = new User();
          newUser.username = username;
          newUser.password = hashed;
          newUser.email = email;
          newUser.fullname = fullname;
          newUser.role = selection[role];
          done(null, newUser);
        });
      })
    }
    // this function takes the new user object and checks to see if that person is asking for extra permission. If so, it first checks to see if they should be granted that permission in our Airtable before saving that account in our Mongodb
    const checkAndSave = (newAccount, done) => {
      newAccount.save((err, user) => err ? done({ status: 503, message: 'Server error saving your account. Please try again later.'}) : done(null, user, newAccount));
      /*const saveAccount = () => newAccount.save((err, user) => err ? done({ status: 503, message: 'Server error saving your account. Please try again later.'}) : done(null, user, newAccount))
      if (newAccount.role !== 'user') return checkAirTableRoles(newAccount.email, newAccount.role).then(() => saveAccount(), e => done({ status: 403, message: 'You are not authorized to register as this role.' }))
      saveAccount();*/
    }

    const emailUser = (user, newAccount, done) => sendEmail.welcome(user.email)
      .then(response => done(null, response, user, newAccount), 
        e => done({ status: 503, message: 'Please refresh and try logging in.' })
      );
    
    async.waterfall([ register, checkAndSave, emailUser ], (err, response, user, newAccount) => {
      if (err) return handleErr(res, err.status, err.message);
      const payload = {
        iss: 'Lambda_Showcase',
        role: user.role,
        id: user._id,
        permitted: user.role !== 'user' ? true : false,
        exp: moment()
          .add(10, 'days')
          .unix()
      }
      const token = jwt.sign(payload, process.env.SECRET);
      res.status(200).json({ success: 'Registration successful!', token });
    })
  },
  /*=================================================================
  User Login
  =================================================================*/
  userLogin: (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username })
      .then((user) => {
        if (!user) return handleErr(res, 401, 'incorrect username');
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err || valid === false) return handleErr(res, 401, 'incorrect password');
          const payload = {
            iss: 'Lambda_Showcase',
            role: user.role,
            id: user._id,
            permitted: user.role !== 'user' ? true : false,
            exp: moment()
              .add(10, 'days')
              .unix()
          }
          const token = jwt.sign(payload, process.env.SECRET);
          res.status(200).json({ message: 'Login successful!', token });
        });
      })
      .catch((err) => {
        if (err) return handleErr(res, 500, 'Server error');
      });
  },

  home: (req, res) => {
    User.findById(req.userId, (err, data) => {
      res.json(data);
    });
  },
  /*=================================================================
  Forgot Password
  =================================================================*/
  forgotPassword: (req, res) => {                                           
    const { email } = req.body;
    //creates confirmation token to be sent to users email address
    const makeToken = done => {
      const token = crypto.AES.encrypt('This is a token!', process.env.SECRET);
      let err = '';
      if (!token) return done({ message: 'Server error creating a reset token' });
        done(err, token);
    }

    const addToUser = (token, done) => {
      User.findOne({ email }, (err, user) => {
        if (err) return done({ message: 'Server error retrieving your account details.'});
        if (!user) return done({ message: 'Could not retrieve an account for that email.'});
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        user.save(saveErr => done(saveErr, user, token));
      })
    }

    const emailUser = (user, token, done) => {
      sendEmail.forgotPassword(user.email, token)
        .then(response => done(null, response, user, token), err => {
          done(err)
        });
    }

    async.waterfall([
      makeToken,
      addToUser,
      emailUser
    ], (err, response, user, token) => {
      if (err) return typeof err === "string" ? handleErr(res, 501, err) : handleErr(res, 500);
      res.status(200).send({ email: user.email });
    });
  },
  /*=================================================================
  Reset Password
  =================================================================*/
  resetPassword: (req, res) => {                                              //Reset Password after receiving the forgotten password email                     
    const { token, password } = req.body;
    if (!token) return handleErr(res, 401, 'You are not authorized to access this route');
    if (!password) return handleErr(res, 411, 'Input a new password');
    User.findOne({ resetPasswordToken: token }, (err, data) => {
      if (err) return handleErr(res, 500);
      if (!data) return handleErr(res, 401, 'Invalid token');
      bcrypt.hash(password, hash, (err, hashedPassword) => {
        data.password = hashedPassword;
        data.save();
        console.log(data.email);
        sendEmail.pwResetSuccess(data.email);
        res.status(200).json({ message: 'success' });
      });
    });
  },
  /*=================================================================
  Find User
  =================================================================*/
  findUser: (req, res) => {
    const { data } = req.body;
    User.findOne({ $or: [{ username: data }, { email: data }, { fullname: data }] }, (err, data) => {
      if (err) return handleErr(res, 500);
      if (!data) return handleErr(res, 404, `That user does not exist`);
      res.status(200).json({ id: data._id, name: data.fullname });
    });
  },

  studentsWhoFinished: (req, res) => {
    User.find({}, {finishedProjects: 1}, { fullname: 1 }, (err, data) => {
      if (err) return handleErr(res, 500);
        res.status(200).json(data);
    });
  }
}

  /*=================================================================
  Admin controllers
  =================================================================*/