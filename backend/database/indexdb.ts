import mongoose from "mongoose";
const connectDb = async () => {
  try {
      const connectionDB = await mongoose.connect(`${process.env.MONGODB_URL}chatroom`)
  console.log(`\n MongoDB connected !! DB HOST: ${connectionDB.connection.host}`)
  } catch (error) {
    console.log("MongoDB connection error: ", error)
  }
}
export default connectDb