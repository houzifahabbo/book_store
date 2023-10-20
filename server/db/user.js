const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: [true, "Username is required"],
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
});

function validatePasswordStrength(password) {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(password);
}

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        // Validate the password
        if (!validatePasswordStrength(this.password)) {
          return next(
            new Error(
              'Password must contain at least one lowercase letter, one uppercase letter, one digit, and be at least 8 characters long.'
            )
          );
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(this.password, saltRounds);
        this.password = hashedPassword;
      }
      next();
});

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);