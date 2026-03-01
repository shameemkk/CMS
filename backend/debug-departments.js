import mongoose from 'mongoose';
import Department from './src/models/Department.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const departments = await Department.find({});
    
    console.log(`\n🏢 Departments found: ${departments.length}`);
    
    if (departments.length === 0) {
      console.log('❌ No departments found! Run: npm run seed:data');
      return;
    }

    departments.forEach(dept => {
      console.log(`   - ${dept.name} (${dept.code}): ${dept.status}`);
    });
    
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkDepartments();