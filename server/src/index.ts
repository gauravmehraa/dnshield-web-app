import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectToDB } from "./utils/mongo";
import { printLog } from "./utils/date";
import { getLogs, uploadLogs } from "./logs";
import { getStats } from "./stats";

const app: Express = express();
try{
  dotenv.config();
  app.use(cors());
  const PORT = process.env.PORT;
  app.use(express.json());
  
  app.get('/api/log', (req: Request, res: Response) => getLogs(req, res));
  app.post('/api/log/upload', (req: Request, res: Response) => uploadLogs(req, res));
  app.get('/api/stats', (req: Request, res: Response) => getStats(req, res));

  app.listen(PORT, () => {
    connectToDB();
    console.log(`[START] - Server running on Port ${PORT}`);
  })
}
catch(error){
  printLog(error, "Index");
}