import { Request, Response } from "express";
import { EventData } from "./models";
import { printLog } from "./utils/date";

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      domain = "",
      prediction = "",
      page = "1",
      limit = "0",
      sort = "createdAt",
      direction = "desc"
    } = req.query;

    const filter: any = {};
    if (typeof domain === "string" && domain.trim() !== "") {
      filter.domain = { $regex: domain, $options: "i" };
    }
    if (typeof prediction === "string" && prediction.trim() !== "") {
      filter.prediction = prediction;
    }
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 0;

    const validSortCols = new Set(["timestamp", "createdAt", "domain", "prediction", "event_type", "dns_domain_name_length", "character_entropy"]);
    const sortColumn = validSortCols.has(sort as string) ? sort as string : "createdAt";
    const sortDir = direction === "asc" ? 1 : -1;
    const query = EventData.find(filter).select("-__v");

    query.sort({ [sortColumn]: sortDir });
    if (limitNum > 0) query.skip((pageNum - 1) * limitNum).limit(limitNum);
    const data = await query.exec();
    const totalCount = await EventData.countDocuments(filter);
    
    res.status(200).json({
      totalCount,
      page: pageNum,
      limit: limitNum,
      logs: data
    });
  } catch (error) {
    printLog(error, "Get Logs Controller");
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const uploadLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    if (!Array.isArray(data)) {
      res.status(400).json({ error: "Expected an array of log objects." });
      return;
    }
    const logsToInsert = data.map(log => {
      const { message, timestamp, ...rest } = log;
      return {
        ...rest,
        timestamp: new Date(timestamp),
      };
    });
    await EventData.insertMany(logsToInsert);
    res.status(200).json({ success: true });
  } catch (error) {
    printLog(error, "Upload Logs Controller");
    res.status(500).json({ error: "Internal Server Error" });
  }
};
