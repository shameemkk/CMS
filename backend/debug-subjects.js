import mongoose from 'mongoose';
import Subject from './src/models/Subject.js';
import User from './src/models/User.js';
import Department from './src/models/Department.js';
import dotenv from 'dotenv';

dotenv.config();

const checkSubjects = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check departments
    const departments = await Department.find({});
    console.log(`\n🏢 Departments found: ${departments.length}`);
    departments.forEach(dept => {
      console.log(`   - ${dept.name} (${dept.code}): ${dept.status}`);
    });

    // Check subjects for BCA department
    const subjects = await Subject.find({ department: 'BCA' }).populate('assignedTeacher');
    
    console.log(`\n📚 Total BCA subjects found: ${subjects.length}`);
    
    if (subjects.length === 0) {
      console.log('❌ No subjects found! Run: npm run seed:data');
      await mongoose.disconnect();
      return;
    }

    // Group by semester
    const bySemester = {};
    subjects.forEach(subject => {
      if (!bySemester[subject.semester]) {
        bySemester[subject.semester] = [];
      }
      bySemester[subject.semester].push(subject);
    });

    Object.keys(bySemester).sort().forEach(semester => {
      console.log(`\n📖 Semester ${semester}:`);
      bySemester[semester].forEach(subject => {
        console.log(`  - ${subject.name} (${subject.code})`);
        console.log(`    Teacher: ${subject.assignedTeacher ? subject.assignedTeacher.fullName : '❌ NOT ASSIGNED'}`);
        console.log(`    Hours/Week: ${subject.hoursPerWeek}, Type: ${subject.subjectType}, Status: ${subject.status}`);
      });
    });

    // Check teachers
    const teachers = await User.find({ role: 'teacher', department: 'BCA' });
    console.log(`\n👨‍🏫 Total BCA teachers found: ${teachers.length}`);
    teachers.forEach(teacher => {
      console.log(`   - ${teacher.fullName} (${teacher.specialization})`);
    });

    // Check HODs
    const hods = await User.find({ role: 'hod' });
    console.log(`\n👔 HODs found: ${hods.length}`);
    hods.forEach(hod => {
      console.log(`   - ${hod.fullName} (${hod.department})`);
    });

    // Validation summary
    const subjectsWithoutTeachers = subjects.filter(s => !s.assignedTeacher);
    console.log(`\n📊 Summary:`);
    console.log(`   - Total subjects: ${subjects.length}`);
    console.log(`   - Subjects with teachers: ${subjects.length - subjectsWithoutTeachers.length}`);
    console.log(`   - Subjects without teachers: ${subjectsWithoutTeachers.length}`);
    
    if (subjectsWithoutTeachers.length > 0) {
      console.log(`\n⚠️  Subjects without teachers:`);
      subjectsWithoutTeachers.forEach(s => console.log(`   - ${s.name} (${s.code})`));
    }
    
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkSubjects();