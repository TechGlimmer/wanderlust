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

// Index route
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listing/index.ejs", {allListings});
});

// New Route
app.get("/listings/new", (req, res) => {
    res.render("listing/new.ejs");
});

// Show Route
app.get("/listings/:id", async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listing/show.ejs", {listing});
});

// Create Route
app.post("/listings", async (req, res) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
});

// Edit Route
app.get("/listings/:id/edit", async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listing/edit.ejs", {listing});
});

// Update Route
app.put("/listings/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
});

// Delete Route
app.delete("/listings/:id", async(req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
})

// Server Port Configuration
const PORT = process.env.PORT || 8080;

app.listen(PORT, (req, res) => {
    console.log(`Server started at port ${PORT}`)
})