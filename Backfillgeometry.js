if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const geocodeLocation = require("./utils/geocode.js");

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/ApnaStay";

async function backfill() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to DB. Starting backfill...");

  // Only listings missing geometry entirely
  const listings = await Listing.find({
    $or: [
      { geometry: { $exists: false } },
      { "geometry.coordinates": { $exists: false } },
    ],
  });

  console.log(`Found ${listings.length} listings without coordinates.`);

  let success = 0;
  let failed = 0;

  for (const listing of listings) {
    try {
      const geometry = await geocodeLocation(`${listing.location}, ${listing.country}`);
      if (geometry) {
        listing.geometry = geometry;
        await listing.save();
        success++;
        console.log(`✓ Geocoded: ${listing.title} (${listing.location}, ${listing.country})`);
      } else {
        failed++;
        console.log(`✗ No result for: ${listing.title} (${listing.location}, ${listing.country})`);
      }
    } catch (err) {
      failed++;
      console.log(`✗ Error geocoding ${listing.title}:`, err.message);
    }

    // Respect Nominatim's 1 request/second rate limit
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
  mongoose.connection.close();
}

backfill();