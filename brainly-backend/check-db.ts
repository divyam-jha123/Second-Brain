import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const emailPreferenceSchema = new mongoose.Schema({
  clerkUserId: String,
  email: String,
  featureAnnouncements: Boolean,
});

const userSchema = new mongoose.Schema({
  clerkUserId: String,
  username: String,
  email: String,
});

const EmailPref = mongoose.model("EmailPreference", emailPreferenceSchema);
const User = mongoose.model("User", userSchema);

async function check() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Users:");
  const users = await User.find().lean();
  console.log(users);
  
  console.log("\nEmailPrefs:");
  const prefs = await EmailPref.find().lean();
  console.log(prefs.map(p => ({ email: p.email, featureAnnouncements: p.featureAnnouncements })));
  
  process.exit(0);
}
check();
