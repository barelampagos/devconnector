const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate(
			'user',
			['name', 'avatar']
		);

		if (!profile) {
			return res
				.status(400)
				.json({ msg: 'There is no profile for this user.' });
		}
	} catch (err) {
		console.error(err.message);
		return res.status(500).send('Server Error');
	}
});

// @route   POST api/profile/
// @desc    Create/Update user profile
// @access  Private
router.post(
	'/',
	[
		auth,
		[
			check('status', 'Status is required.')
				.not()
				.isEmpty(),
			check('skills', 'Skills is required.')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			website,
			location,
			bio,
			status,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin
		} = req.body;

		// Build profile
		const profileFields = {};

		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(',').map(skill => skill.trim());
		}

		// Build social
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			// Try to find existing
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				// Update profile
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);

				return res.json(profile);
			}

			// Create
			profile = new Profile(profileFields);
			await profile.save();
			return res.json(profile);
		} catch (err) {
			console.log(err.message);
			return res.status(500).send('Server error');
		}

		res.send('Hello');
	}
);

// @route   GET api/profile/
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.json(profiles);
	} catch (err) {
		console.error(err.message);
		return res.status(500).send('Server Error');
	}
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id
		}).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res.status(400).json({ msg: 'Profile not found.' });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);

		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'Profile not found.' });
		}

		return res.status(500).send('Server Error');
	}
});

// @route   DELETE api/profile/
// @desc    Delete profile, user & posts
// @access  Private
router.delete('/', auth, async (req, res) => {
	try {
		// TODO: Remove users posts

		// Remove profile
		await Profile.findOneAndRemove({ user: req.user.id });

		// Remove user
		await User.findOneAndRemove({ _id: req.user.id });

		res.json({ msg: 'User deleted' });
	} catch (err) {
		console.error(err.message);
		return res.status(500).send('Server Error');
	}
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required')
				.not()
				.isEmpty(),
			check('company', 'Company is required')
				.not()
				.isEmpty(),
			check('from', 'From date is required')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		} = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		};

		try {
			// Remove profile
			const profile = await Profile.findOne({ user: req.user.id });

			profile.experience.unshift(newExp);
			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err.message);
			return res.status(500).send('Server Error');
		}
	}
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		// Remove profile
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove index
		// Iterate all experience, get all item ids, and return index
		// of ID that matches req.exp_id
		const removeIndex = profile.experience
			.map(item => item.id)
			.indexOf(req.params.exp_id);

		profile.experience.splice(removeIndex, 1);
		await profile.save();
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		return res.status(500).send('Server Error');
	}
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'School is required')
				.not()
				.isEmpty(),
			check('degree', 'Degree is required')
				.not()
				.isEmpty(),
			check('fieldofstudy', 'Field of Study is required')
				.not()
				.isEmpty(),
			check('from', 'From date is required')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description
		} = req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description
		};

		try {
			// Remove profile
			const profile = await Profile.findOne({ user: req.user.id });

			profile.education.unshift(newEdu);
			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err.message);
			return res.status(500).send('Server Error');
		}
	}
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete profile education
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
	try {
		// Remove profile
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove index
		// Iterate all education, get all item ids, and return index
		// of ID that matches req.edu_id
		const removeIndex = profile.education
			.map(item => item.id)
			.indexOf(req.params.edu_id);

		profile.education.splice(removeIndex, 1);
		await profile.save();
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		return res.status(500).send('Server Error');
	}
});

module.exports = router;
