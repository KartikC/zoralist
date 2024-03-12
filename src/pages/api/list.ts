// pages/api/list.ts

import type { NextApiRequest, NextApiResponse } from "next";

export type Owner = {
  address: string;
  tokenCount: string;
  ensName: string | null;
  avatarUrl: string | null;
};

export type Metadata = {
  name: string;
  description: string;
  image: string;
};

export type Data = {
  owners: Owner[];
  metadata?: Metadata; // This property is optional in case metadata fetching fails
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

async function fetchMetadata(contractAddress: string): Promise<Metadata | null> {
  const apiKey = process.env.RESERVOIR_API_KEY;
  try {
    const metadataResponse = await fetch(
      `https://api-zora.reservoir.tools/tokens/v7?collection=${contractAddress}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey as string, // TypeScript type assertion
        },
      }
    );

    if (!metadataResponse.ok) throw new Error('Failed to fetch metadata');

    const metadataJson = await metadataResponse.json();
    const firstToken = metadataJson.tokens[0].token;

    return {
      name: firstToken.name,
      description: firstToken.description,
      image: firstToken.image,
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${contractAddress}:`, error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "GET") {
    const { contract, token, limit } = req.query;

    if (!contract) {
      res.status(400).json({ owners: [] });
      return;
    }

    try {
      const apiKey = process.env.RESERVOIR_API_KEY || ''; // Fallback to an empty string if undefined
      const ownersResponse = await fetch(
        `https://api-zora.reservoir.tools/owners/v2?token=${contract}:${token}&limit=${limit || '100'}`,
        {
          headers: {
            'accept': 'application/json',
            'x-api-key': apiKey as string, // TypeScript type assertion
          },
        }
      );

      const metadata = await fetchMetadata(contract as string);

      if (ownersResponse.ok) {
        const ownersData = await ownersResponse.json();
        const ownersPromiseArray = ownersData.owners.map(async (owner: { address: string; ownership: { tokenCount: any; }; }) => {
          const { ensName, avatarUrl } = await fetchEnsData(owner.address);
          return {
            address: owner.address,
            tokenCount: owner.ownership.tokenCount,
            ensName,
            avatarUrl,
          };
        });

        const owners = await Promise.all(ownersPromiseArray);
        res.status(200).json({ owners, metadata: metadata || undefined });
      } else {
        res.status(ownersResponse.status).json({ owners: [] });
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
      res.status(500).json({ owners: [] });
    }
  } else {
    res.status(405).json({ owners: [] });
  }
}