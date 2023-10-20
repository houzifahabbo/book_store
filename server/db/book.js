const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookSchema = new Schema({
	title: { type: String, required: true },
	author: { type: String, required: true },
	published: { type: Date, required: true },
	pages: { type: Number, required: true },
	price: { type: Number, required: true },
	owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Book", bookSchema);
