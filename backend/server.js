import mongoose from 'mongoose';
import app from './app';
import config from './config/index';

// this function is an IIFE (Immediately Invoked Function Expression)
(async () => {
  try {
    const res = await mongoose.connect(config.MONGODB_URL);
    console.log(`Database connected: ${res.connection.host}`);

    // 'on' method will listen to an error event and a callback will be fired when an error occurs
    app.on('error', err => {
      console.log(`Error: ${err}`);
      throw err;
    });

    app.listen(config.PORT, () =>
      console.log(`Server is running on http://localhost:${config.PORT}`)
    );
  } catch (err) {
    console.log('Database connection failed');
    console.log(`Error: ${err.message}`);
    // following code can be used in place of process.exit(1)
    throw err;
  }
})();
