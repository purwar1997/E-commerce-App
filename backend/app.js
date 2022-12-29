import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';

const app = express();

// mounting middlewares on root path('/')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// morgan is a logger which logs information about API request
// 'tiny' returns minimal information about the request
app.use(morgan('tiny'));

export default app;
