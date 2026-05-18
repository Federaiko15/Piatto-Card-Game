import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // tramite la funzione di libreria connect di mongoose provo a collegarmi a MongoDB
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`, // prendendo l'url contenente la password di accesso dal mio file .env
    );
    console.log(
      `\n MongoDB correttamente collegato !!! ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.log("MongoDB connection error!!", error);
    process.exit(1);
  }
};

export default connectDB;
