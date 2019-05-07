const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

// Async await --> try catch
const connectDB = async () => {
	try {
		await mongoose.connect(db, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false
		});
		console.log('MongoDB Connected');
	} catch (err) {
		console.log(err.message);

		// Exit process w/ failure
		process.exit(1);
	}
};

module.exports = connectDB;
