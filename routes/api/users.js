const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');

// Load User model
const User = require('../../models/User');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) =>
	res.json({
		msg: 'Users Works'
	})
);

// @route   POST api/users/register
// @desc    Register User
// @access  Public
router.post(
	'/',
	[
		check('name', 'Name is required')
			.not()
			.isEmpty(),
		check('email', 'Please include a valid email').isEmail(),
		check(
			'password',
			'Please enter a password with 6 or more characters'
		).isLength({ min: 6 })
	],
	(req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status;
		}

		User.findOne({
			email: req.body.email
		}).then(user => {
			if (user) {
				return res.status(400).json({
					email: 'Email already exists.'
				});
			} else {
				const avatar = gravatar.url(req.body.email, {
					s: '200', // Size
					r: 'pg', // Rating
					d: 'mm' // Default
				});

				const newUser = new User({
					name: req.body.name,
					email: req.body.email,
					avatar,
					password: req.body.password
				});

				bcrypt.genSalt(10, (err, salt) => {
					bcrypt.hash(newUser.password, salt, (err, hash) => {
						if (err) throw err;
						newUser.password = hash;
						newUser
							.save()
							.then(user => res.json(user))
							.catch(err => console.log(err));
					});
				});
			}
		});
	}
);

// @route   POST api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/login', (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	// Find user by email
	User.findOne({
		email
	}).then(user => {
		// Check for user
		if (!user) {
			return res.status(404).json({
				email: 'User not found'
			});
		}

		// Check pwd
		bcrypt.compare(password, user.password).then(isMatch => {
			if (isMatch) {
				// User Matched

				// Create JWT Payload
				const payload = {
					id: user.id,
					name: user.name,
					avatar: user.avatar
				};

				// Sign token sign(payload, secret/key, expiration, callback)
				// 3600: 1 hr
				jwt.sign(
					payload,
					keys.secretOrKey,
					{
						expiresIn: 3600
					},
					(err, token) => {
						res.json({
							success: true,
							token: 'Bearer ' + token
						});
					}
				);
			} else {
				return res.status(400).json({
					password: 'Password incorrect'
				});
			}
		});
	});
});

module.exports = router;
