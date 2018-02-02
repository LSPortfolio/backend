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
          newUser.role = role;
          done(null, newUser);
        });
      })
    }
    // this function takes the new user object and checks to see if that person is asking for extra permission. If so, it first checks to see if they should be granted that permission in our Airtable before saving that account in our Mongodb
    const checkAndSave = (newAccount, done) => {
      const saveAccount = () => newAccount.save((err, user) => err ? done({ status: 503, message: 'Server error saving your account. Please try again later.'}) : done(null, user, newAccount))
      if (newAccount.role !== 'user') return checkAirTableRoles(newAccount.email, newAccount.role).then(() => saveAccount(), e => done({ status: 403, message: 'You are not authorized to register as this role.' }))
      saveAccount();
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
      res.status(200).json({ success: 'yes', jwtToken: token, userData });
    })
  },
  /*=================================================================
  User Login
  =================================================================*/
  userLogin: (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username })
      .then((user) => {
        if (!user) return res.status(400).json({ error : 'incorrect username' });
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err || valid === false) return res.status(400).json({ error : 'incorrect password' });
          const payload = {
            iss: 'Lambda_Showcase',
            role: user.role,
            id: user._id,
            permitted: user.role !== 'user' ? true : false,
            exp: moment()
              .add(10, 'days')
              .unix()
          }
          const token = jwt.sign(payload, process.env.SECRET);               //Will update soon
          res.status(200).json({ success: 'yes', token, user });
        });
      })
      .catch((err) => {
        if (err) return res.status(400).json(err.message);
      });
  },
  userHome: (req, res) => {
    User.findOne(req.userId, (err, data) => {
      if (err) return handleErr(res, 500);
      if (!data) return handleErr(res, 404, 'Could not find User');
      res.json({ user: data, otherData: req.decoded })
    });
  },
  /*=================================================================
  Forgot Password
  =================================================================*/
  forgotPassword: (req, res) => {                                           
    const { email } = req.body;
    //creates confirmation token to be sent to users email address
    const makeToken = done => {
        let err = '';
        const token = crypto.AES.encrypt('my message', process.env.SECRET);
        if (!token) {
          let err = handleErr(res, 404, 'Error creating token');
        }
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
          console.log(err);
          done(err)
        });
    }

    async.waterfall([
      makeToken,
      addToUser,
      emailUser
    ], (err, response, user, token) => {
      if (err) return typeof err === "string" ? handleErr(res, 501, err) : handleErr(res, 500);
      res.status(200).send({ email: user.email, sendToken: user.resetPasswordToken });
    });
  },
  /*=================================================================
  Reset Password
  This allows the user to reset the password after receiving a authenticator token
  =================================================================*/
  resetPassword: (req, res) => {
    //const { token } req.query;
    const { password, token } = req.body;
    if (!password || !token) return handleErr(res, 404, 'Unauthorized Access!! Do you even know what this is?');
    User.findOne({ resetPasswordToken: token }, (err, data) => {
      if (err) return handleErr(res, 500);
      if (!data) return handleErr(res, 404, 'User not found');
      bcrypt.hash(password, hash, (err, hashedPassword) => {
        if (err) return handleErr(res, 400, 'Error caused by an issue in hashing the password');
        data.password = hashedPassword;
        data.save();
        sendEmail.pwResetSuccess(data.email)
        res.json({ message: 'success' });
      });
    });
  },
  /*=================================================================
  Find User
  =================================================================*/
  findUser: (req, res) => {
    const { username, email, fullname } = req.body;
    if (!username && !email && !fullname) return handleErr(res, 403, `Please make sure you have the correct search input.`);
    User.findOne({ $or: [{ username }, { email }, { fullname }] }, (err, data) => {
      if (err) return handleErr(res, 500);
      if (!data) return handleErr(res, 404, `That user does not exist`);
      res.json({ send: data._id });
    });
  },

  studentsWhoFinished: (req, res) => {
    User.find({$nor: [{finishedProjects: {$exists: false}}, {finishedProjects: {$size: 0}}]}, {fullname: 1, finishedProjects: 1}, (err, data) => {
      if (err) return handleErr(res, 500);
        res.json(data);
    });
  }
}
