# Create Admin User Script
# Run this in your backend directory with Node.js

import bcrypt from 'bcryptjs'
import { UserModel } from './models/userModel.js'
import { connect } from 'mongoose'
import { config } from 'dotenv'

config()

const createAdminUser = async () => {
  try {
    await connect(process.env.DB_URL)
    console.log('Connected to database')

    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = new UserModel({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true
    })

    await admin.save()
    console.log('✅ Admin user created successfully!')
    console.log('Email: admin@example.com')
    console.log('Password: admin123')
    console.log('\n⚠️  Change password immediately after first login!')
    
    process.exit(0)
  } catch (err) {
    console.error('Error creating admin:', err.message)
    process.exit(1)
  }
}

createAdminUser()
