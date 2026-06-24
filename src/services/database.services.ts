import mongoose, { Collection } from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const uri = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@ac-hsvicco-shard-00-00.yv7cgpx.mongodb.net:27017,ac-hsvicco-shard-00-01.yv7cgpx.mongodb.net:27017,ac-hsvicco-shard-00-02.yv7cgpx.mongodb.net:27017/webluyenthitienganh?ssl=true&replicaSet=atlas-11ege2-shard-0&authSource=admin&retryWrites=true&w=majority`

class DatabaseService {
  private isConnected: boolean

  constructor() {
    this.isConnected = false
  }

  async connect() {
    try {
      if (!this.isConnected) {
        await mongoose.connect(uri)
        this.isConnected = true
        console.log('Connected to MongoDB with Mongoose!')
      }
    } catch (error) {
      console.error(' MongoDB connection error:', error)
      throw error
    }
  }
}

const databaseService = new DatabaseService()
export default databaseService
