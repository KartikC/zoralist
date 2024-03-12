// pages/api/owners.ts

import type { NextApiRequest, NextApiResponse } from "next";

type Owner = {
  address: string;
  tokenCount: string;
};

type Data = {
  owners: Owner[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "GET") {
    const { contract, token, limit } = req.query;

    if (!contract || !token) {
      res.status(400).json({ owners: [] });
      return;
    }
    try {
      const apiKey = process.env.RESERVOIR_API_KEY;
      const response = await fetch(
        `https://api-zora.reservoir.tools/owners/v2?token=${contract}:${token}&limit=${limit || 100}`,
        {
          headers: {
            accept: "*/*",
            "x-api-key": apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const owners = data.owners.map((owner) => ({
          address: owner.address,
          tokenCount: owner.ownership.tokenCount,
        }));
        res.status(200).json({ owners });
      } else {
        res.status(response.status).json({ owners: [] });
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
      res.status(500).json({ owners: [] });
    }
  } else {
    res.status(405).json({ owners: [] });
  }
}