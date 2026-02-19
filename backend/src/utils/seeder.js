import mongoose from 'mongoose';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Starting data seeding for BCA department...');

    // Clear existing data
    await User.deleteMany({});
    await Subject.deleteMany({});
    console.log('✓ Cleared existing data');

    // HOD data
    const hodData = {
      fullName: 'Dr. Rajesh Kumar',
      email: 'hod.bca@college.edu',
      phone: '9876543210',
      department: 'BCA',
      role: 'hod',
      password: 'hod123456',
      status: 'approved'
    };

    // Teachers data with specializations
    const teachersData = [
      {
        fullName: 'Prof. Priya Sharma',
        email: 'priya.sharma@college.edu',
        phone: '9876543211',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Programming Languages'
      },
      {
        fullName: 'Dr. Amit Patel',
        email: 'amit.patel@college.edu',
        phone: '9876543212',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Database Systems'
      },
      {
        fullName: 'Ms. Neha Gupta',
        email: 'neha.gupta@college.edu',
        phone: '9876543213',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Web Development'
      },
      {
        fullName: 'Prof. Vikram Singh',
        email: 'vikram.singh@college.edu',
        phone: '9876543214',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Data Structures'
      },
      {
        fullName: 'Dr. Sunita Rao',
        email: 'sunita.rao@college.edu',
        phone: '9876543215',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Mathematics'
      },
      {
        fullName: 'Mr. Arjun Mehta',
        email: 'arjun.mehta@college.edu',
        phone: '9876543216',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Computer Networks'
      },
      {
        fullName: 'Dr. Kavita Joshi',
        email: 'kavita.joshi@college.edu',
        phone: '9876543217',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Software Engineering'
      },
      {
        fullName: 'Prof. Rahul Verma',
        email: 'rahul.verma@college.edu',
        phone: '9876543218',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Operating Systems'
      },
      {
        fullName: 'Ms. Pooja Agarwal',
        email: 'pooja.agarwal@college.edu',
        phone: '9876543219',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'English Communication'
      }
    ];

    // Students data
    const studentsData = [
      {
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@student.edu',
        phone: '9876543220',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Vivaan Patel',
        email: 'vivaan.patel@student.edu',
        phone: '9876543221',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Aditya Kumar',
        email: 'aditya.kumar@student.edu',
        phone: '9876543222',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Vihaan Singh',
        email: 'vihaan.singh@student.edu',
        phone: '9876543223',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Arjun Gupta',
        email: 'arjun.gupta@student.edu',
        phone: '9876543224',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Sai Reddy',
        email: 'sai.reddy@student.edu',
        phone: '9876543225',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Reyansh Jain',
        email: 'reyansh.jain@student.edu',
        phone: '9876543226',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Ayaan Khan',
        email: 'ayaan.khan@student.edu',
        phone: '9876543227',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Krishna Yadav',
        email: 'krishna.yadav@student.edu',
        phone: '9876543228',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Ishaan Verma',
        email: 'ishaan.verma@student.edu',
        phone: '9876543229',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Ananya Sharma',
        email: 'ananya.sharma@student.edu',
        phone: '9876543230',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Diya Patel',
        email: 'diya.patel@student.edu',
        phone: '9876543231',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Aadhya Singh',
        email: 'aadhya.singh@student.edu',
        phone: '9876543232',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Pihu Gupta',
        email: 'pihu.gupta@student.edu',
        phone: '9876543233',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Myra Kumar',
        email: 'myra.kumar@student.edu',
        phone: '9876543234',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Anika Rao',
        email: 'anika.rao@student.edu',
        phone: '9876543235',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Kavya Mehta',
        email: 'kavya.mehta@student.edu',
        phone: '9876543236',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Saanvi Joshi',
        email: 'saanvi.joshi@student.edu',
        phone: '9876543237',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Avni Agarwal',
        email: 'avni.agarwal@student.edu',
        phone: '9876543238',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Riya Bansal',
        email: 'riya.bansal@student.edu',
        phone: '9876543239',
        department: 'BCA',
        role: 'student',
        password: 'student123',
        status: 'approved'
      }
    ];

    // Create HOD
    const hod = new User(hodData);
    await hod.save();
    console.log('✓ HOD created successfully');

    // Create Teachers
    const createdTeachers = [];
    for (const teacherData of teachersData) {
      const teacher = new User(teacherData);
      await teacher.save();
      createdTeachers.push(teacher);
    }
    console.log('✓ 9 Teachers created successfully');

    // Create Students
    for (const studentData of studentsData) {
      const student = new User(studentData);
      await student.save();
    }
    console.log('✓ 20 Students created successfully');

    // BCA Subjects Data based on PDF content
    const subjectsData = [
      // Semester 1
      { name: 'Fundamentals of Computer', code: 'BCA101', semester: 1, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Programming in C', code: 'BCA102', semester: 1, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Mathematics-I', code: 'BCA103', semester: 1, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Mathematics' },
      { name: 'Digital Electronics', code: 'BCA104', semester: 1, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'English Communication', code: 'BCA105', semester: 1, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'English Communication' },
      { name: 'C Programming Lab', code: 'BCA106', semester: 1, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Programming Languages' },

      // Semester 2
      { name: 'Data Structures', code: 'BCA201', semester: 2, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Data Structures' },
      { name: 'Object Oriented Programming with C++', code: 'BCA202', semester: 2, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Mathematics-II', code: 'BCA203', semester: 2, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Mathematics' },
      { name: 'Computer Organization', code: 'BCA204', semester: 2, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Operating Systems' },
      { name: 'Environmental Studies', code: 'BCA205', semester: 2, credits: 2, hoursPerWeek: 2, subjectType: 'theory', teacherSpecialization: 'English Communication' },
      { name: 'Data Structures Lab', code: 'BCA206', semester: 2, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Data Structures' },
      { name: 'C++ Programming Lab', code: 'BCA207', semester: 2, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Programming Languages' },

      // Semester 3
      { name: 'Database Management System', code: 'BCA301', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Database Systems' },
      { name: 'Java Programming', code: 'BCA302', semester: 3, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Computer Networks', code: 'BCA303', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Operating Systems', code: 'BCA304', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Operating Systems' },
      { name: 'Discrete Mathematics', code: 'BCA305', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Mathematics' },
      { name: 'DBMS Lab', code: 'BCA306', semester: 3, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Database Systems' },
      { name: 'Java Programming Lab', code: 'BCA307', semester: 3, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Programming Languages' },

      // Semester 4
      { name: 'Software Engineering', code: 'BCA401', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Software Engineering' },
      { name: 'Web Development', code: 'BCA402', semester: 4, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Web Development' },
      { name: 'Computer Graphics', code: 'BCA403', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'System Analysis and Design', code: 'BCA404', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Software Engineering' },
      { name: 'Statistics', code: 'BCA405', semester: 4, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'Mathematics' },
      { name: 'Web Development Lab', code: 'BCA406', semester: 4, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Web Development' },
      { name: 'Computer Graphics Lab', code: 'BCA407', semester: 4, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Programming Languages' },

      // Semester 5
      { name: 'Advanced Java', code: 'BCA501', semester: 5, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Data Mining', code: 'BCA502', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Database Systems' },
      { name: 'Mobile Application Development', code: 'BCA503', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Web Development' },
      { name: 'Artificial Intelligence', code: 'BCA504', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Data Structures' },
      { name: 'Network Security', code: 'BCA505', semester: 5, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Advanced Java Lab', code: 'BCA506', semester: 5, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Programming Languages' },
      { name: 'Mobile App Development Lab', code: 'BCA507', semester: 5, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Web Development' },

      // Semester 6
      { name: 'Cloud Computing', code: 'BCA601', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Machine Learning', code: 'BCA602', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Data Structures' },
      { name: 'Cyber Security', code: 'BCA603', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Project Management', code: 'BCA604', semester: 6, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'Software Engineering' },
      { name: 'Internship/Project', code: 'BCA605', semester: 6, credits: 6, hoursPerWeek: 6, subjectType: 'practical', teacherSpecialization: 'Software Engineering' },
      { name: 'Machine Learning Lab', code: 'BCA606', semester: 6, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Data Structures' },

      // Semester 7
      { name: 'Big Data Analytics', code: 'BCA701', semester: 7, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Database Systems' },
      { name: 'Internet of Things', code: 'BCA702', semester: 7, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Blockchain Technology', code: 'BCA703', semester: 7, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'DevOps and Automation', code: 'BCA704', semester: 7, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Software Engineering' },
      { name: 'Elective I', code: 'BCA705', semester: 7, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'Web Development' },
      { name: 'Big Data Lab', code: 'BCA706', semester: 7, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Database Systems' },
      { name: 'IoT Lab', code: 'BCA707', semester: 7, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Computer Networks' },

      // Semester 8
      { name: 'Deep Learning', code: 'BCA801', semester: 8, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Data Structures' },
      { name: 'Natural Language Processing', code: 'BCA802', semester: 8, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Quantum Computing', code: 'BCA803', semester: 8, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Mathematics' },
      { name: 'Elective II', code: 'BCA804', semester: 8, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'Software Engineering' },
      { name: 'Major Project', code: 'BCA805', semester: 8, credits: 8, hoursPerWeek: 8, subjectType: 'practical', teacherSpecialization: 'Software Engineering' },
      { name: 'Deep Learning Lab', code: 'BCA806', semester: 8, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Data Structures' }
    ];

    // Create subjects and assign teachers
    const createdSubjects = [];
    for (const subjectData of subjectsData) {
      // Find teacher with matching specialization
      const assignedTeacher = createdTeachers.find(teacher => 
        teacher.specialization === subjectData.teacherSpecialization
      );

      const subject = new Subject({
        name: subjectData.name,
        code: subjectData.code,
        department: 'BCA',
        semester: subjectData.semester,
        credits: subjectData.credits,
        hoursPerWeek: subjectData.hoursPerWeek,
        subjectType: subjectData.subjectType,
        assignedTeacher: assignedTeacher ? assignedTeacher._id : null,
        createdBy: hod._id,
        status: 'active'
      });

      await subject.save();
      createdSubjects.push(subject);
    }

    console.log(`✓ ${createdSubjects.length} Subjects created successfully with assigned teachers`);

    console.log('🎉 Data seeding completed successfully!');
    console.log(`Total users created: ${1 + teachersData.length + studentsData.length}`);
    console.log(`Total subjects created: ${createdSubjects.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    throw error;
  }
};

// Function to run seeder independently
const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await seedData();
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Seeder failed:', error);
    process.exit(1);
  }
};

// If this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeder();
}

export default seedData;