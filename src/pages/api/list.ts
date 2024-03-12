// pages/api/list.ts

import type { NextApiRequest, NextApiResponse } from "next";

export type Owner = {
  address: string;
  tokenCount: string;
  ensName: string | null;
  avatarUrl: string | null;
};

export type Data = {
  owners: Owner[];
};

async function fetchEnsData(address: string): Promise<{ ensName: string | null; avatarUrl: string | null }> {
  try {
    const response = await fetch(`https://ensdata.net/${address}`);
    if (response.ok) {
      const data = await response.json();
      const ensName = data.ens || null;
      const avatarUrl = data.avatar_url || null;

      // Check if the avatar_url returns an image
      if (avatarUrl) {
        const avatarResponse = await fetch(avatarUrl);
        if (!avatarResponse.ok || !avatarResponse.headers.get("content-type")?.startsWith("image/")) {
          return { ensName, avatarUrl: null };
        }
      }

      return { ensName, avatarUrl };
    }
  } catch (error) {
    console.error(`Error fetching ENS data for ${address}:`, error);
  }

  return { ensName: null, avatarUrl: null };
}

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

    http://localhost:3000/api/list?contract=0x72d07beebb80f084329da88063f5e52f70f020a3&token=1&limit=100

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
        const owners = await Promise.all(
          data.owners.map(async (owner: { address: string; ownership: { tokenCount: any; }; }) => {
            const { ensName, avatarUrl } = await fetchEnsData(owner.address);
            return {
              address: owner.address,
              tokenCount: owner.ownership.tokenCount,
              ensName,
              avatarUrl,
            };
          })
        );
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