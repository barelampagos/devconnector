const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {
	check,
	validationResult
} = require('express-validator/check');

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

// @route   POST api/users/
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
		).isLength({
			min: 6
		})
	],
	async (req, res) => {
		const errors = validationResult(req);
		console.log(req.body)

		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array()
			});
		}

		const {
			name,
			email,
			password
		} = req.body;

		try {
			// Check if user exists
			let user = await User.findOne({
				email
			});

			if (user) {
				return res.status(400).json({
					errors: [{
						msg: 'User already exists.'
					}]
				});
			}

			// Get user's gravatar
			const avatar = gravatar.url(email, {
				s: '200', // Size
				r: 'pg', // Rating
				d: 'mm' // Default
			});

			user = new User({
				name,
				email,
				avatar,
				password
			});

			// Encrypt password
			const salt = await bcrypt.genSalt(10);

			user.password = await bcrypt.hash(password, salt);

			await user.save();

			// Return jsonwebtoken
			const payload = {
				user: {
					id: user.id
				}
			};

			jwt.sign(
				payload,
				config.get('jwtSecret'), {
					expiresIn: 360000
				},
				(err, token) => {
					if (err) throw err;
					res.json({
						token
					})
				}
			);
		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server error');
		}
	});

module.exports = router;