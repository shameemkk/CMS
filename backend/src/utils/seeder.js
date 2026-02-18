import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Starting data seeding for BCA department...');

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

    // Teachers data
    const teachersData = [
      {
        fullName: 'Prof. Priya Sharma',
        email: 'priya.sharma@college.edu',
        phone: '9876543211',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved'
      },
      {
        fullName: 'Dr. Amit Patel',
        email: 'amit.patel@college.edu',
        phone: '9876543212',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved'
      },
      {
        fullName: 'Ms. Neha Gupta',
        email: 'neha.gupta@college.edu',
        phone: '9876543213',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved'
      },
      {
        fullName: 'Prof. Vikram Singh',
        email: 'vikram.singh@college.edu',
        phone: '9876543214',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved'
      },
      {
        fullName: 'Dr. Sunita Rao',
        email: 'sunita.rao@college.edu',
        phone: '9876543215',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved'
      },
      {
        fullName: 'Mr. Arjun Mehta',
        email: 'arjun.mehta@college.edu',
        phone: '9876543216',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved'
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
    for (const teacherData of teachersData) {
      const teacher = new User(teacherData);
      await teacher.save();
    }
    console.log('✓ 6 Teachers created successfully');

    // Create Students
    for (const studentData of studentsData) {
      const student = new User(studentData);
      await student.save();
    }
    console.log('✓ 20 Students created successfully');

    console.log('🎉 Data seeding completed successfully!');
    console.log(`Total users created: ${1 + teachersData.length + studentsData.length}`);
    
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