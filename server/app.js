const express = require("express");
const routes = require("./routes");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
require("./db/connection");
require("dotenv").config();

const app = express();

const middleware = [
	cookieParser(),
	bodyParser.urlencoded({ extended: false }),
	express.json(),
	express.static(path.join(__dirname, "../client")),
];

middleware.forEach((item) => {
	app.use(item);
});

app.use("/", routes);

app.set("view engine", "ejs");
app.set("views", "../client");

app.listen(3000, () => {
	console.log("Server started on port 3000");
});
