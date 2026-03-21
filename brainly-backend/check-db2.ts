import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const emailPreferenceSchema = new mongoose.Schema({
  clerkUserId: String,
  email: String,
  featureAnnouncements: Boolean,
});

const EmailPref = mongoose.model("EmailPreference", emailPreferenceSchema);

async function check() {
  await mongoose.connect(process.env.MONGO_URI as string);
  const prefs = await EmailPref.find().lean();
  console.log("Current Email Preferences:");
  console.log(prefs.map(p => ({ email: p.email, featureAnnouncements: p.featureAnnouncements })));
  process.exit(0);
}
check();
