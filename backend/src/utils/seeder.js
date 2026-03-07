import mongoose from 'mongoose';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Department from '../models/Department.js';
import Batch from '../models/Batch.js';
import MinorMajor from '../models/MinorMajor.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Starting comprehensive data seeding...');

    // Clear existing data
    await Department.deleteMany({});
    await Batch.deleteMany({});
    await User.deleteMany({});
    await Subject.deleteMany({});
    await MinorMajor.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create Admin user first (needed for createdBy references)
    const adminUser = new User({
      fullName: 'System Administrator',
      email: 'admin@college.edu',
      phone: '9999999999',
      department: 'ADMIN',
      role: 'admin',
      password: 'admin123456',
      status: 'approved'
    });
    await adminUser.save();
    console.log('✓ Admin user created');

    // Create Departments
    const departmentsData = [
      {
        name: 'Computer Application',
        code: 'BCA',
        description: 'Bachelor of Computer Applications - 6 Semester Program',
        createdBy: adminUser._id,
        status: 'active'
      },
      {
        name: 'Commerce',
        code: 'BCOM',
        description: 'Bachelor of Commerce - 6 Semester Program',
        createdBy: adminUser._id,
        status: 'active'
      },
      {
        name: 'Arts',
        code: 'BA',
        description: 'Bachelor of Arts - 6 Semester Program',
        createdBy: adminUser._id,
        status: 'active'
      },
      {
        name: 'Science',
        code: 'BSC',
        description: 'Bachelor of Science - 6 Semester Program',
        createdBy: adminUser._id,
        status: 'active'
      }
    ];

    const createdDepartments = [];
    for (const dept of departmentsData) {
      const department = new Department(dept);
      await department.save();
      createdDepartments.push(department);
    }
    console.log(`✓ ${createdDepartments.length} Departments created successfully`);

    // Create Batches
    const batchesData = [
      {
        department: 'BCA',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2027-05-31'),
        semester: 3,
        status: 'active',
        createdBy: adminUser._id
      },
      {
        department: 'BCOM',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2027-05-31'),
        semester: 3,
        status: 'active',
        createdBy: adminUser._id
      },
      {
        department: 'BA',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2027-05-31'),
        semester: 3,
        status: 'active',
        createdBy: adminUser._id
      },
      {
        department: 'BSC',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2027-05-31'),
        semester: 3,
        status: 'active',
        createdBy: adminUser._id
      }
    ];

    const createdBatches = [];
    for (const batchData of batchesData) {
      const batch = new Batch(batchData);
      await batch.save();
      createdBatches.push(batch);
    }
    console.log(`âœ“ ${createdBatches.length} Batches created successfully`);

    // Create HODs for each department
    const hodsData = [
      {
        fullName: 'Dr. Rajesh Kumar',
        email: 'hod.bca@college.edu',
        phone: '9876543210',
        department: 'BCA',
        role: 'hod',
        password: 'hod123456',
        status: 'approved'
      },
      {
        fullName: 'Dr. Priya Sharma',
        email: 'hod.bcom@college.edu',
        phone: '9876543211',
        department: 'BCOM',
        role: 'hod',
        password: 'hod123456',
        status: 'approved'
      },
      {
        fullName: 'Dr. Amit Patel',
        email: 'hod.ba@college.edu',
        phone: '9876543212',
        department: 'BA',
        role: 'hod',
        password: 'hod123456',
        status: 'approved'
      },
      {
        fullName: 'Dr. Sunita Rao',
        email: 'hod.bsc@college.edu',
        phone: '9876543213',
        department: 'BSC',
        role: 'hod',
        password: 'hod123456',
        status: 'approved'
      }
    ];

    const createdHODs = [];
    for (const hodData of hodsData) {
      const hod = new User(hodData);
      await hod.save();
      createdHODs.push(hod);
    }
    console.log(`✓ ${createdHODs.length} HODs created successfully`);

    // Create Teachers for BCA Department
    const bcaTeachersData = [
      {
        fullName: 'Prof. Neha Gupta',
        email: 'neha.gupta@college.edu',
        phone: '9876543220',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Programming Languages'
      },
      {
        fullName: 'Dr. Vikram Singh',
        email: 'vikram.singh@college.edu',
        phone: '9876543221',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Database Systems'
      },
      {
        fullName: 'Ms. Kavita Joshi',
        email: 'kavita.joshi@college.edu',
        phone: '9876543222',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Web Development'
      },
      {
        fullName: 'Prof. Rahul Verma',
        email: 'rahul.verma@college.edu',
        phone: '9876543223',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Data Structures'
      },
      {
        fullName: 'Dr. Pooja Agarwal',
        email: 'pooja.agarwal@college.edu',
        phone: '9876543224',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Mathematics'
      },
      {
        fullName: 'Mr. Arjun Mehta',
        email: 'arjun.mehta@college.edu',
        phone: '9876543225',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Computer Networks'
      },
      {
        fullName: 'Dr. Ravi Kumar',
        email: 'ravi.kumar@college.edu',
        phone: '9876543226',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Software Engineering'
      },
      {
        fullName: 'Prof. Meera Jain',
        email: 'meera.jain@college.edu',
        phone: '9876543227',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Operating Systems'
      },
      {
        fullName: 'Ms. Anjali Sharma',
        email: 'anjali.sharma@college.edu',
        phone: '9876543228',
        department: 'BCA',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'English Communication'
      }
    ];

    const createdTeachers = [];
    for (const teacherData of bcaTeachersData) {
      const teacher = new User(teacherData);
      await teacher.save();
      createdTeachers.push(teacher);
    }
    console.log(`✓ ${createdTeachers.length} BCA Teachers created successfully`);

    // Create Teachers for BCOM Department
    const bcomTeachersData = [
      {
        fullName: 'Prof. Sanjay Mehta',
        email: 'sanjay.mehta@college.edu',
        phone: '9876543230',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Financial Accounting'
      },
      {
        fullName: 'Dr. Rekha Nair',
        email: 'rekha.nair@college.edu',
        phone: '9876543231',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Business Economics'
      },
      {
        fullName: 'Prof. Deepak Joshi',
        email: 'deepak.joshi@college.edu',
        phone: '9876543232',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Business Mathematics'
      },
      {
        fullName: 'Ms. Anita Desai',
        email: 'anita.desai@college.edu',
        phone: '9876543233',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Business Communication'
      },
      {
        fullName: 'Dr. Suresh Pillai',
        email: 'suresh.pillai@college.edu',
        phone: '9876543234',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Law and Taxation'
      },
      {
        fullName: 'Prof. Geeta Rao',
        email: 'geeta.rao@college.edu',
        phone: '9876543235',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Management'
      },
      {
        fullName: 'Dr. Krishnan Iyer',
        email: 'krishnan.iyer@college.edu',
        phone: '9876543236',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Finance and Banking'
      },
      {
        fullName: 'Prof. Divya Menon',
        email: 'divya.menon@college.edu',
        phone: '9876543237',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'Marketing and E-Commerce'
      },
      {
        fullName: 'Mr. Ramesh Nambiar',
        email: 'ramesh.nambiar@college.edu',
        phone: '9876543238',
        department: 'BCOM',
        role: 'teacher',
        password: 'teacher123',
        status: 'approved',
        specialization: 'IT and Office Automation'
      }
    ];

    const createdBcomTeachers = [];
    for (const teacherData of bcomTeachersData) {
      const teacher = new User(teacherData);
      await teacher.save();
      createdBcomTeachers.push(teacher);
    }
    console.log(`✓ ${createdBcomTeachers.length} BCOM Teachers created successfully`);

    // Create Students for BCA Department
    const bcaBatch = createdBatches.find((batch) => batch.department === 'BCA');
    const bcaStudentsData = [
      {
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@student.edu',
        registrationNumber: 'BCA2024001',
        department: 'BCA',
        batch: bcaBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Vivaan Patel',
        email: 'vivaan.patel@student.edu',
        registrationNumber: 'BCA2024002',
        department: 'BCA',
        batch: bcaBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Aditya Kumar',
        email: 'aditya.kumar@student.edu',
        registrationNumber: 'BCA2024003',
        department: 'BCA',
        batch: bcaBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Vihaan Singh',
        email: 'vihaan.singh@student.edu',
        registrationNumber: 'BCA2024004',
        department: 'BCA',
        batch: bcaBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Arjun Gupta',
        email: 'arjun.gupta@student.edu',
        registrationNumber: 'BCA2024005',
        department: 'BCA',
        batch: bcaBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      }
    ];

    for (const studentData of bcaStudentsData) {
      const student = new User(studentData);
      await student.save();
    }
    console.log(`✓ ${bcaStudentsData.length} BCA Students created successfully`);

    // Create Students for BCOM Department
    const bcomBatch = createdBatches.find((batch) => batch.department === 'BCOM');
    const bcomStudentsData = [
      {
        fullName: 'Aisha Khan',
        email: 'aisha.khan@student.edu',
        registrationNumber: 'BCOM2024001',
        department: 'BCOM',
        batch: bcomBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Rahul Nair',
        email: 'rahul.nair@student.edu',
        registrationNumber: 'BCOM2024002',
        department: 'BCOM',
        batch: bcomBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Priya Menon',
        email: 'priya.menon@student.edu',
        registrationNumber: 'BCOM2024003',
        department: 'BCOM',
        batch: bcomBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Siddharth Pillai',
        email: 'siddharth.pillai@student.edu',
        registrationNumber: 'BCOM2024004',
        department: 'BCOM',
        batch: bcomBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      },
      {
        fullName: 'Anjali Verma',
        email: 'anjali.verma@student.edu',
        registrationNumber: 'BCOM2024005',
        department: 'BCOM',
        batch: bcomBatch?.batchCode,
        role: 'student',
        password: 'student123',
        status: 'approved'
      }
    ];

    for (const studentData of bcomStudentsData) {
      const student = new User(studentData);
      await student.save();
    }
    console.log(`✓ ${bcomStudentsData.length} BCOM Students created successfully`);

    // BCA Subjects Data (6 Semester Program)
    const bcaSubjectsData = [
      // Semester 1
      { name: 'Fundamentals of Computer', code: 'BCA101', semester: 1, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Programming in C', code: 'BCA102', semester: 1, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Mathematics-I', code: 'BCA103', semester: 1, credits: 4, hoursPerWeek: 4, subjectType: 'major', teacherSpecialization: 'Mathematics' },
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

      // Semester 3
      { name: 'Database Management System', code: 'BCA301', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'major', teacherSpecialization: 'Database Systems' },
      { name: 'Java Programming', code: 'BCA302', semester: 3, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Computer Networks', code: 'BCA303', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Operating Systems', code: 'BCA304', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Operating Systems' },
      { name: 'Discrete Mathematics', code: 'BCA305', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'minor1', teacherSpecialization: 'Mathematics' },
      { name: 'DBMS Lab', code: 'BCA306', semester: 3, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Database Systems' },

      // Semester 4
      { name: 'Software Engineering', code: 'BCA401', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Software Engineering' },
      { name: 'Web Development', code: 'BCA402', semester: 4, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Web Development' },
      { name: 'Computer Graphics', code: 'BCA403', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'System Analysis and Design', code: 'BCA404', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Software Engineering' },
      { name: 'Statistics', code: 'BCA405', semester: 4, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'Mathematics' },
      { name: 'Web Development Lab', code: 'BCA406', semester: 4, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Web Development' },

      // Semester 5
      { name: 'Advanced Java', code: 'BCA501', semester: 5, credits: 4, hoursPerWeek: 5, subjectType: 'theory', teacherSpecialization: 'Programming Languages' },
      { name: 'Data Mining', code: 'BCA502', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Database Systems' },
      { name: 'Mobile Application Development', code: 'BCA503', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Web Development' },
      { name: 'Artificial Intelligence', code: 'BCA504', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Data Structures' },
      { name: 'Network Security', code: 'BCA505', semester: 5, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Advanced Java Lab', code: 'BCA506', semester: 5, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Programming Languages' },

      // Semester 6
      { name: 'Cloud Computing', code: 'BCA601', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Machine Learning', code: 'BCA602', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Data Structures' },
      { name: 'Cyber Security', code: 'BCA603', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'theory', teacherSpecialization: 'Computer Networks' },
      { name: 'Project Management', code: 'BCA604', semester: 6, credits: 3, hoursPerWeek: 3, subjectType: 'theory', teacherSpecialization: 'Software Engineering' },
      { name: 'Major Project', code: 'BCA605', semester: 6, credits: 6, hoursPerWeek: 6, subjectType: 'practical', teacherSpecialization: 'Software Engineering' },
      { name: 'Machine Learning Lab', code: 'BCA606', semester: 6, credits: 2, hoursPerWeek: 3, subjectType: 'lab', teacherSpecialization: 'Data Structures' }
    ];

    // Get the BCA HOD for createdBy reference
    const bcaHOD = createdHODs.find(hod => hod.department === 'BCA');

    // Create BCA subjects and assign teachers
    const createdSubjects = [];
    for (const subjectData of bcaSubjectsData) {
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
        createdBy: bcaHOD._id,
        status: 'active'
      });

      await subject.save();
      createdSubjects.push(subject);
    }

    console.log(`✓ ${createdSubjects.length} BCA Subjects created successfully with assigned teachers`);

    // BCOM Subjects Data (6 Semester Program)
    const bcomSubjectsData = [
      // Semester 1
      { name: 'Financial Accounting', code: 'BCOM101', semester: 1, credits: 4, hoursPerWeek: 5, subjectType: 'major' },
      { name: 'Business Organization', code: 'BCOM102', semester: 1, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Business Economics', code: 'BCOM103', semester: 1, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Business Mathematics', code: 'BCOM104', semester: 1, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Business Communication', code: 'BCOM105', semester: 1, credits: 3, hoursPerWeek: 3, subjectType: 'theory' },
      { name: 'Accounting Practical', code: 'BCOM106', semester: 1, credits: 2, hoursPerWeek: 3, subjectType: 'practical' },

      // Semester 2
      { name: 'Advanced Financial Accounting', code: 'BCOM201', semester: 2, credits: 4, hoursPerWeek: 5, subjectType: 'major' },
      { name: 'Corporate Law', code: 'BCOM202', semester: 2, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Business Statistics', code: 'BCOM203', semester: 2, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Principles of Management', code: 'BCOM204', semester: 2, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Environmental Studies', code: 'BCOM205', semester: 2, credits: 2, hoursPerWeek: 2, subjectType: 'theory' },
      { name: 'Office Automation Lab', code: 'BCOM206', semester: 2, credits: 2, hoursPerWeek: 3, subjectType: 'lab' },

      // Semester 3
      { name: 'Corporate Accounting', code: 'BCOM301', semester: 3, credits: 4, hoursPerWeek: 5, subjectType: 'major' },
      { name: 'Cost Accounting', code: 'BCOM302', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'major' },
      { name: 'Banking Theory and Practice', code: 'BCOM303', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Income Tax Law and Practice', code: 'BCOM304', semester: 3, credits: 4, hoursPerWeek: 4, subjectType: 'minor1' },
      { name: 'Entrepreneurship Development', code: 'BCOM305', semester: 3, credits: 3, hoursPerWeek: 3, subjectType: 'minor2' },
      { name: 'Tally Lab', code: 'BCOM306', semester: 3, credits: 2, hoursPerWeek: 3, subjectType: 'lab' },

      // Semester 4
      { name: 'Management Accounting', code: 'BCOM401', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'major' },
      { name: 'Auditing', code: 'BCOM402', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Business Regulatory Framework', code: 'BCOM403', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'E-Commerce', code: 'BCOM404', semester: 4, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Human Resource Management', code: 'BCOM405', semester: 4, credits: 3, hoursPerWeek: 3, subjectType: 'theory' },
      { name: 'E-Commerce Lab', code: 'BCOM406', semester: 4, credits: 2, hoursPerWeek: 3, subjectType: 'lab' },

      // Semester 5
      { name: 'Income Tax Procedures', code: 'BCOM501', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Goods and Services Tax', code: 'BCOM502', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'major' },
      { name: 'Financial Management', code: 'BCOM503', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Marketing Management', code: 'BCOM504', semester: 5, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Computerized Accounting', code: 'BCOM505', semester: 5, credits: 3, hoursPerWeek: 3, subjectType: 'practical' },
      { name: 'Research Methodology', code: 'BCOM506', semester: 5, credits: 3, hoursPerWeek: 3, subjectType: 'theory' },

      // Semester 6
      { name: 'International Business', code: 'BCOM601', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Indirect Tax', code: 'BCOM602', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'major' },
      { name: 'Investment Management', code: 'BCOM603', semester: 6, credits: 4, hoursPerWeek: 4, subjectType: 'theory' },
      { name: 'Project Work', code: 'BCOM604', semester: 6, credits: 6, hoursPerWeek: 6, subjectType: 'practical' },
      { name: 'Viva Voce', code: 'BCOM605', semester: 6, credits: 2, hoursPerWeek: 2, subjectType: 'practical' },
      { name: 'Business Analytics', code: 'BCOM606', semester: 6, credits: 3, hoursPerWeek: 3, subjectType: 'theory' }
    ];

    const bcomHOD = createdHODs.find(hod => hod.department === 'BCOM');

    for (const subjectData of bcomSubjectsData) {
      const subject = new Subject({
        name: subjectData.name,
        code: subjectData.code,
        department: 'BCOM',
        semester: subjectData.semester,
        credits: subjectData.credits,
        hoursPerWeek: subjectData.hoursPerWeek,
        subjectType: subjectData.subjectType,
        assignedTeacher: null,
        createdBy: bcomHOD._id,
        status: 'active'
      });

      await subject.save();
      createdSubjects.push(subject);
    }

    console.log(`âœ“ ${bcomSubjectsData.length} BCOM Subjects created successfully`);

    // Create MinorMajor configurations for all semesters
    const minorMajorConfigs = [
      // BCA Department - Semester 1 (Minor1 and Major subjects)
      {
        department: 'BCA',
        semester: 1,
        subjectType: 'minor1',
        prioritySlot: 1, // 1st period (09:30-10:30)
        description: 'Minor1 subjects are scheduled in 1st period for BCA Semester 1',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        department: 'BCA',
        semester: 1,
        subjectType: 'major',
        prioritySlot: 2, // 2nd period (10:30-11:20)
        description: 'Major subjects are scheduled in 2nd period for BCA Semester 1',
        isActive: true,
        createdBy: adminUser._id
      },
      // BCA Department - Semester 3 (Minor and Major subjects)
      {
        department: 'BCA',
        semester: 3,
        subjectType: 'minor1',
        prioritySlot: 2, // 2nd period (10:30-11:20)
        description: 'Minor1 subjects are scheduled in 2nd period for BCA Semester 3',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        department: 'BCA',
        semester: 3,
        subjectType: 'minor2',
        prioritySlot: 3, // 3rd period (11:30-12:30)
        description: 'Minor2 subjects are scheduled in 3rd period for BCA Semester 3',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        department: 'BCA',
        semester: 3,
        subjectType: 'major',
        prioritySlot: 4, // 4th period (13:30-14:30)
        description: 'Major subjects are scheduled in 4th period for BCA Semester 3',
        isActive: true,
        createdBy: adminUser._id
      },
      // BCOM Department configurations
      {
        department: 'BCOM',
        semester: 1,
        subjectType: 'major',
        prioritySlot: 3, // 3rd period (11:30-12:30)
        description: 'Major subjects are scheduled in 3rd period for BCOM Semester 1',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        department: 'BCOM',
        semester: 3,
        subjectType: 'minor1',
        prioritySlot: 3, // 3rd period (11:30-12:30)
        description: 'Minor1 subjects are scheduled in 3rd period for BCOM Semester 3',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        department: 'BCOM',
        semester: 3,
        subjectType: 'minor2',
        prioritySlot: 4, // 4th period (13:30-14:30)
        description: 'Minor2 subjects are scheduled in 4th period for BCOM Semester 3',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        department: 'BCOM',
        semester: 3,
        subjectType: 'major',
        prioritySlot: 2, // 2nd period (10:30-11:20)
        description: 'Major subjects are scheduled in 2nd period for BCOM Semester 3',
        isActive: true,
        createdBy: adminUser._id
      }
    ];

    const createdMinorMajorConfigs = [];
    for (const configData of minorMajorConfigs) {
      const config = new MinorMajor(configData);
      await config.save();
      createdMinorMajorConfigs.push(config);
    }
    console.log(`✓ ${createdMinorMajorConfigs.length} MinorMajor configurations created successfully`);

    // Summary
    console.log('\n🎉 Data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Departments: ${createdDepartments.length}`);
    console.log(`   - Batches: ${createdBatches.length}`);
    console.log(`   - Admin Users: 1`);
    console.log(`   - HODs: ${createdHODs.length}`);
    console.log(`   - Teachers: ${createdTeachers.length}`);
    console.log(`   - Students: ${bcaStudentsData.length + bcomStudentsData.length} (BCA: ${bcaStudentsData.length}, BCOM: ${bcomStudentsData.length})`);
    console.log(`   - Subjects: ${createdSubjects.length}`);
    console.log(`   - MinorMajor Configs: ${createdMinorMajorConfigs.length}`);

    // Validation check
    const subjectsWithoutTeachers = createdSubjects.filter(s => !s.assignedTeacher);
    if (subjectsWithoutTeachers.length > 0) {
      console.log(`⚠️  Warning: ${subjectsWithoutTeachers.length} subjects don't have assigned teachers`);
    } else {
      console.log(`✅ All subjects have assigned teachers`);
    }

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

// Function to run seeder independently
const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await seedData();

    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
};

// If this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeder();
}

export default seedData;
