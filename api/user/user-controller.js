const User = require('./user-model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const format = (first, last) => {
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }
  return `${first.capitalize()} ${last.capitalize()}`;
}

const handleErr = (res, status, message, data) => {
  return status === 500 ? res.status(500).send({ message: 'Server error with this operation.' }) : res.status(status).send({ message });
}

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
        const token = jwt.sign(payload, process.env.SECRET);
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

  find: (req, res) => {
    const { data } = req.body;
    User.findOne({ $or: [{ username: data }, { email: data }]}, (err, foundData) => {
      if (err) return handleErr(res, 404, 'server error');
      if (!foundData) return handleErr(res, 403, 'Could not find user');
      res.status(200).json(foundData);
    })
  },
}