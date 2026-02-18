#!/usr/bin/env node

/**
 * Standalone script to run the data seeder
 * Usage: node src/utils/runSeeder.js
 */

import mongoose from 'mongoose';
import seedData from './seeder.js';
import dotenv from 'dotenv';

dotenv.config();

const runSeeder = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    await seedData();
    
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
};

runSeeder();