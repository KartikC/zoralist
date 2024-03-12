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
  // Define the number of retries and a delay function
  const maxRetries = 3;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`https://ensdata.net/${address}`);
      if (response.ok) {
        const data = await response.json();
        const ensName = data.ens || null;
        const avatarUrl = data.avatar_url || null;
        
        if (avatarUrl) {
          // Ensure the avatar URL points to an image
          const avatarResponse = await fetch(avatarUrl);
          if (avatarResponse.ok && avatarResponse.headers.get("content-type")?.startsWith("image/")) {
            return { ensName, avatarUrl };
          }
        }
        
        return { ensName, avatarUrl: null };
      }
      // If the response was not OK, wait before retrying
      await delay(1000 * attempt); 
    } catch (error) {
      console.error(`Attempt ${attempt} - Error fetching ENS data for ${address}:`, error);
      if (attempt < maxRetries) {
        // Wait before retrying
        await delay(1000 * attempt);
      }
    }
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
  if (req.method !== "GET") {
    res.status(405).json({ owners: [] });
    return;
  }

  const { contract, token, limit } = req.query;

  if (!contract) {
    res.status(400).json({ owners: [] });
    return;
  }

  try {
    const apiKey = process.env.RESERVOIR_API_KEY || '';
    const [ownersResponse, metadataResponse] = await Promise.all([
      fetch(
        `https://api-zora.reservoir.tools/owners/v2?token=${contract}:${token}&limit=${limit || '100'}`,
        { headers: { 'accept': 'application/json', 'x-api-key': apiKey }}
      ),
      fetchMetadata(contract as string)
    ]);

    if (!ownersResponse.ok) {
      res.status(ownersResponse.status).json({ owners: [] });
      return;
    }

    const ownersData = await ownersResponse.json();
    const ownersWithEns = await Promise.all(
      ownersData.owners.map(async (owner: { address: string; ownership: { tokenCount: any; }; }) => {
        const { ensName, avatarUrl } = await fetchEnsData(owner.address);
        return {
          address: owner.address,
          tokenCount: owner.ownership.tokenCount,
          ensName,
          avatarUrl,
        };
      })
    );

    if (metadataResponse !== null) {
      res.status(200).json({ owners: ownersWithEns, metadata: metadataResponse });
    } else {
      res.status(200).json({ owners: ownersWithEns });
    }
  } catch (error) {
    console.error("Error fetching owners or metadata:", error);
    res.status(500).json({ owners: [] });
  }
}
