import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import home from './routes/home.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan(
    ':remote-addr :date[web] :method :url HTTP/:http-version :status :res[content-type] :res[content-length] - :response-time ms'
  )
);
app.use('/api/v1', home);

export default app;
