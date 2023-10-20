const express = require('express');
const routes = express.Router();
const jwt = require("jsonwebtoken");
const User = require("./db/user");
const Book = require("./db/book");
const middleware = require("./middleware");

const generateJWT = (user) => {
	return jwt.sign(
		{
			id: user.id,
			username: user.username,
			exp: Math.floor(Date.now() / 1000) + 86400,
			iat: Math.floor(Date.now() / 1000),
		},
		process.env.JWT_SECRET,
	);
};

// user routes

routes.get("/", middleware.isAuthenticated, (req, res) => {
	const isAuthenticated = res.locals.isAuthenticated;
	res.render("index", { error: "", endpoint: "home", auth: isAuthenticated });
});

routes.get("/signup", middleware.isAuthenticated, (req, res) => {
	const isAuthenticated = res.locals.isAuthenticated;
	res.render("index", { error: "", endpoint: "signup", auth: isAuthenticated });
});

routes.get("/signin", middleware.isAuthenticated, (req, res) => {
	const isAuthenticated = res.locals.isAuthenticated;
	res.render("index", { error: "", endpoint: "signin", auth: isAuthenticated });
});

routes.post("/signin", middleware.isAuthenticated, async (req, res) => {
	const { username, password } = req.body;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(401).render("index", {
				error: "Username or password incorrect",
				endpoint: "signin",
			});
		}
		const valid = user.comparePassword(password);
		if (!valid) {
			return res.status(401).render("index", {
				error: "Username or password incorrect",
				endpoint: "signin",
			});
		}
		const token = generateJWT(user);
		res.cookie("jwt", token, { httpOnly: true });
		res.status(200).redirect("/");
	} catch (error) {
		res.render("index", { error: error.message, endpoint: "signin" });
	}
});

routes.post("/signup", middleware.isAuthenticated, async (req, res) => {
	const { username, password } = req.body;
	try {
		let user = await User.findOne({ username });
		if (user) {
			return res.status(401).render("index", {
				error: "Username already exists",
				endpoint: "signup",
			});
		}
		user = new User({
			username,
			password,
		});
		await user.save();
		const token = generateJWT(user);
		res.cookie("jwt", token, { httpOnly: true });
		res.status(200).redirect("/");
	} catch (error) {
		res.render("index", { error: error.message, endpoint: "signup" });
	}
});

routes.post("/signout", middleware.isAuthenticated, (req, res) => {
	res.clearCookie("jwt");
	res.redirect("/");
});

// book routes

routes.get("/books", middleware.isAuthenticated, async (req, res) => {
	const isAuthenticated = res.locals.isAuthenticated;
	const error = res.locals.error;
	const renderOptions = {
		auth: isAuthenticated,
		books: [],
		endpoint: "books",
		error: error,
		isBookOwner: false,
	};
	try {
		const books = await Book.find();
		if (!books) {
			renderOptions.error = { get: "No books found" };
			return res.status(404).render("books", renderOptions);
		}
		renderOptions.books = books;
		res.status(200).render("books", renderOptions);
	} catch (error) {
		renderOptions.error = { unexpected: error.message };
		res.status(500).render("books", renderOptions);
	}
});

routes.get(
	"/books/:id",
	middleware.isAuthenticated,
	middleware.isBookOwner,
	async (req, res) => {
		const { id } = req.params;
		const isAuthenticated = res.locals.isAuthenticated;
		const error = res.locals.error;
		const isBookOwner = res.locals.isBookOwner;
		const renderOptions = {
			auth: isAuthenticated,
			books: [],
			endpoint: "book",
			error: error,
			isBookOwner: isBookOwner,
		};
		try {
			const book = await Book.findById(id);
			if (!book) {
				renderOptions.error = { get: "No book found" };
				return res.status(404).render("books", renderOptions);
			}
			renderOptions.books = [book];
			res.status(200).render("books", renderOptions);
		} catch (error) {
			renderOptions.error = { unexpected: error.message };
			res.status(500).render("books", renderOptions);
		}
	},
);

routes.get(
	"/addbook",
	middleware.isAuthenticated,
	middleware.isBookOwner,
	(req, res) => {
		const isAuthenticated = res.locals.isAuthenticated;
		const isBookOwner = res.locals.isBookOwner;
		const error = res.locals.error;
		const renderOptions = {
			auth: isAuthenticated,
			books: [],
			endpoint: "add",
			error: error,
			isBookOwner: isBookOwner,
		};
		return res.render("books", renderOptions);
	},
);

routes.get(
	"/editbook/:id",
	middleware.isAuthenticated,
	middleware.isBookOwner,
	async (req, res) => {
		const { id } = req.params;
		const isAuthenticated = res.locals.isAuthenticated;
		const error = res.locals.error;
		const isBookOwner = res.locals.isBookOwner;
		const renderOptions = {
			auth: isAuthenticated,
			books: [],
			endpoint: "edit",
			error: error,
			isBookOwner: isBookOwner,
		};
		try {
			const book = await Book.findById(id);
			if (!book) {
				renderOptions.error = { get: "No book found" };
				return res.status(404).render("books", renderOptions);
			}
			renderOptions.books = [book];
			res.status(200).render("books", renderOptions);
		} catch (error) {
			renderOptions.error = { unexpected: error.message };
			res.status(500).render("books", renderOptions);
		}
	},
);

routes.post("/addbook", middleware.authMiddleware, async (req, res) => {
	const { title, author, published, pages, price } = req.body;
	const renderOptions = {
		auth: res.locals.isAuthenticated,
		books: [],
		endpoint: "add",
		error: "",
		isBookOwner: false,
	};
	try {
		const book = new Book({
			title,
			author,
			published,
			pages,
			price,
			owner: req.user.id,
		});
		await book.save();
		res.status(201).redirect("/books");
	} catch (error) {
		renderOptions.error = { unexpected: error.message };
		res.status(500).render("books", renderOptions);
	}
});

routes.post(
	"/editbook/:id",
	middleware.authMiddleware,
	middleware.isBookOwner,
	async (req, res) => {
		const id = req.book;
		const { title, author, published, pages, price } = req.body;
		const error = res.locals.error;
		const renderOptions = {
			auth: res.locals.isAuthenticated,
			books: [],
			endpoint: "edit",
			error: error,
			isBookOwner: res.locals.isBookOwner,
		};
		try {
			console.log(id, req.body, req.book);
			const book = await Book.findByIdAndUpdate(
				id,
				{ title, author, published, pages, price },
				{ new: true },
			);
			if (!book) {
				renderOptions.error = { get: "No book found" };
				return res.status(404).render("books", renderOptions);
			}
			res.status(200).redirect(`/books`);
		} catch (error) {
			renderOptions.error = { unexpected: error.message };
			res.status(500).render("books", renderOptions);
		}
	},
);

routes.post(
	"/deletebook/:id",
	middleware.authMiddleware,
	middleware.isBookOwner,
	async (req, res) => {
		const renderOptions = {
			auth: res.locals.isAuthenticated,
			books: [],
			endpoint: "book",
			error: res.locals.error,
			isBookOwner: res.locals.isBookOwner,
		};
		const id = req.book;
		try {
			const result = await Book.findByIdAndDelete(id);
			if (!result) {
				renderOptions.error = { get: "No book found" };
				return res.status(404).render("books", renderOptions);
			}
			res.status(200).redirect("/books");
		} catch (error) {
			renderOptions.error = { unexpected: error.message };
			res.status(500).render("books", renderOptions);
		}
	},
);

module.exports = routes;