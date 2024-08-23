// Load environment variables from .env file
require('dotenv').config();

// All require packages
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const Listing = require("./models/listing.js");
const method_Override = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js")

// Use, set and engine require things
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(method_Override("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Database connection successful");
    } catch (err) {
        console.error("Database connection error:", err);
    }
}

main();

// Main Route
app.get("/", (req, res) => {
    res.send("CONNECTED")
})

// Middleware error handle function
const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        console.log(error);
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

// Index route
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listing/index.ejs", {allListings});
}));

// New Route
app.get("/listings/new", (req, res) => {
    res.render("listing/new.ejs");
});

// Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listing/show.ejs", {listing});
}));

// Create Route
app.post("/listings", validateListing, wrapAsync(async (req, res) => {
    let result = listingSchema.validate(req.body);
    if(result.error) {
        throw new ExpressError(400, result.error);
    }
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

// Edit Route
app.get("/listings/:id/edit", validateListing, wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listing/edit.ejs", {listing});
}));

// Update Route
app.put("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

// Delete Route
app.delete("/listings/:id", wrapAsync(async(req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    let {statusCode = 500, message = "Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs", {message});
})

// Server Port Configuration
const PORT = process.env.PORT || 8080;

app.listen(PORT, (req, res) => {
    console.log(`Server started at port ${PORT}`)
})