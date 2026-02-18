import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_db',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expire: process.env.JWT_EXPIRE || '7d',
  },
  
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};

// Validate required environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default_secret_change_in_production') {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Change this in production!');
}

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  WARNING: MONGODB_URI not set. Using default localhost connection.');
}


