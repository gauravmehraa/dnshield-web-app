import { Request, Response } from "express";
import { printLog } from "./utils/date";
import { EventData } from "./models";

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await EventData.aggregate([
      {
        $facet: {
          totalLogs: [{ $count: "count" }],
          byPrediction: [ { $group: { _id: "$prediction", count: { $sum: 1 } } } ],
          byEventType: [ { $group: { _id: "$event_type", count: { $sum: 1 } } } ],
          averageDomainLength: [{ $group: { _id: null, avg: { $avg: "$dns_domain_name_length" }} }],
          averageEntropy: [{ $group: { _id: null, avg: { $avg: "$character_entropy" }} }],
          averageSendingBytes: [{ $group: { _id: null, avg: { $avg: "$sending_bytes" }} }],
          averageReceivingBytes: [{ $group: { _id: null, avg: { $avg: "$receiving_bytes" }} } ],
          averageTTL: [{ $group: { _id: null, avg: { $avg: "$ttl_mean" }} }],
          averageVowelsConsonantRatio: [{ $group: { _id: null, avg: { $avg: "$vowels_consonant_ratio" }} }],
          topDomains: [
            { $group: { _id: "$domain", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          largestDomain: [
            { $sort: { dns_domain_name_length: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, domain: 1, dns_domain_name_length: 1 } }
          ]
        }
      }
    ]);
    const aggregated = stats[0];
    
    const parsedStats = {
      totalLogs: aggregated.totalLogs[0]?.count || 0,
      byPrediction: aggregated.byPrediction || [],
      byEventType: aggregated.byEventType || [],
      averageDomainLength: aggregated.averageDomainLength[0]?.avg || 0,
      averageEntropy: aggregated.averageEntropy[0]?.avg || 0,
      averageSendingBytes: aggregated.averageSendingBytes[0]?.avg || 0,
      averageReceivingBytes: aggregated.averageReceivingBytes[0]?.avg || 0,
      averageTTL: aggregated.averageTTL[0]?.avg || 0,
      averageVowelsConsonantRatio: aggregated.averageVowelsConsonantRatio[0]?.avg || 0,
      topDomains: aggregated.topDomains || [],
      largestDomain: (aggregated.largestDomain && aggregated.largestDomain[0]) || null
    };
    res.status(200).json(parsedStats);
  } catch (error) {
    printLog(error, "Get Stats Controller");
    res.status(500).json({ error: "Internal Server Error" });
  }
};
