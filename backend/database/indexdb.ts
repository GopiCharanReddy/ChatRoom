import {MongoClient} from 'mongodb'
const connectDb = async () => {
  try {
      const connectionDB = new MongoClient(`${process.env.MONGODB_URL}`)
      connectionDB.connect();
  console.log(`\n MongoDB connected !! DB HOST: ${connectionDB}`)
  } catch (error) {
    console.log("MongoDB connection error: ", error)
  }
}
export default connectDb