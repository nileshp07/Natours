const mongoose = require('mongoose');
const dotenv = require('dotenv');

//HANDLING UNHANDLED ERRORS FROM SYNCHRONOUS CODE i.e NOT FROM ASYNC CODE
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 💥. Shutting down.');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 3000;

//REPLACING THE <PASSWORD> FORM THE HOSTED CONNECTION STRING WITH THE ACTUAL PASSWORD
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// CONNECTING MONGODB DATABASE WITH OUR APP
mongoose.connect(DB, {}).then(() => console.log('DB connected successfully!'));

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//HANDLING UNHANDLED REJECTED PROMISES / ASYNC CODE
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection . Shutting down.');
  server.close(() => {
    process.exit(1);
  });
});
