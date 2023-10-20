const BookModel = require("./db/book");
const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
	const token = req.cookies.jwt;
	if (token) {
		const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decodedToken;
		if (req.path.includes("/signin") || req.path.includes("/signup")) {
			return res.redirect("/");
		} else {
			res.locals.isAuthenticated = true;
		}
	} else {
		res.locals.isAuthenticated = false;
	}
	next();
};

const authMiddleware = (req, res, next) => {
	const token = req.cookies.jwt;
	if (!token) {
		res.locals.error = "Unauthorized";
	} else {
		try {
			const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
			req.user = decodedToken;
			next();
		} catch (error) {
			res.locals.error = { unexpected: error.message };
		}
	}
};

const isBookOwner = async (req, res, next) => {
	const user = req.user;
	const { id } = req.params;
	try {
		if (user) {
			const book = await BookModel.findById(id);
			if (!book) {
				res.locals.error = "No book found";
			}
			if (book && book.owner.equals(user.id)) {
				req.book = id;
				res.locals.isBookOwner = true;
			} else {
				res.locals.isBookOwner = false;
			}
		}
		next();
	} catch (error) {
		res.locals.error = error.message;
	}
};

module.exports = { isAuthenticated, authMiddleware, isBookOwner };
