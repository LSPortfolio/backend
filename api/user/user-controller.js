const User = require('./user-model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const container = require('../../config/config');
const async = require('async');
const { handleErr, checkAirTableRoles, sendEmail } = require('../util');
const hash = 11;
const moment = require('moment');

module.exports = {

  createUser: (req, res) => {   
    const error = {}                                              
    let { username, password, answer, email, firstname, lastname, role } = req.body;
    // This function checks to see if this user already exists, if there is an error, return that, if there is a user, stop, if not, hash the password and create the new user object to be saved later.
    const register = done => {
      const { username, password, answer, email, firstname, lastname, role } = req.body;
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
          newUser.answer = answer;
          newUser.email = email;
          newUser.firstname = firstname;
          newUser.lastname = lastname;
          newUser.role = role;
          newUser.fullname = `${firstname} ${lastname}`
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


    const emailUser = (user, newAccount, done) => sendEmail.welcome(user.email).then(response => done(null, response, user, newAccount), e => done({ status: 503, message: 'Please refresh and try logging in.'}));
    
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
      res.json({ token, user });
    })
  },

  userLogin: (req, res) => {                                                  //Standard user login
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
          const token = jwt.sign(payload, container.secret);               //Will update soon
          res.json({ success: 'yes', jtwToken: token, user });
        });
      })
      .catch((err) => {
        if (err) return res.status(400).json(err.message);
      });
  },

  forgotPassword: (req, res) => {                                             //Forgot password Part
    const { email } = req.body;

    const makeToken = done => {
      crypto.randomBytes(20, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      })
    }

    const addToUser = (token, done) => {
      User.findOne({ email }, (err, user) => {
        if (err) return done({ 'Server error retrieving your account details.' });
        if (!user) return done({ 'Could not retrieve an account for that email.' });
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        user.save(saveErr => done(saveErr, user, token));
      })
    }

    const emailUser = (user, token, done) => {
      sendEmail.forgotPassword(user.email, token)
        .then(response => done(null, response, user, token), err => done(err));
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
