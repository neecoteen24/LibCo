import 'dotenv/config';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  user.role = 'admin';
  await user.save();

  console.log(`✅ Promoted to admin: ${user.email} (${user._id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
