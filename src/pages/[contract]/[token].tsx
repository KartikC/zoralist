import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as jdenticon from 'jdenticon';
import styles from '../../styles/ListPage.module.css';
import Image from 'next/image';
import React from 'react';

interface Owner {
  address: string;
  tokenCount: number;
  ensName: string | null;
  avatarUrl: string | null;
}

interface Metadata {
  name: string;
  description: string;
  image: string;
}

function AvatarComponent({ owner }: { owner: Owner }) {
  if (owner.avatarUrl) {
    return <img src={owner.avatarUrl} alt="Avatar" className={styles.ownerAvatar} />;
  } else {
    const identiconSvg = jdenticon.toSvg(owner.address, 40);
    return (
      <img 
        src={`data:image/svg+xml;utf8,${encodeURIComponent(identiconSvg)}`} 
        alt="Identicon" 
        className={styles.ownerAvatar} 
      />
    );
  }
}

const Avatar = React.memo(AvatarComponent);

const ListPage = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { contract, token } = router.query;

  useEffect(() => {
    if (typeof contract === 'string' && typeof token === 'string') {
      setLoading(true); // Start loading
      fetch(`/api/list?contract=${contract}&token=${token}&limit=100`)
        .then(response => response.json())
        .then(data => {
          setOwners(data.owners);
          setMetadata(data.metadata);
          setLoading(false); // End loading after data is fetched
        })
        .catch(() => setLoading(false)); // End loading even if there is an error
    }
  }, [contract, token]);

  // Define the URL for the metadata section link dynamically
  const metadataUrl = metadata ? `https://zora.co/collect/zora:${contract}/${token}` : '#';


  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Image src="/zoad.gif" alt="Loading" className={styles.loadingGif} width={500} height={500} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {metadata && (
                <a
                href={metadataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ownerLink}
              >
        <div className={styles.collectionMetadata}>
          <Image src={metadata.image} alt={metadata.name} className={styles.metadataImage} width={500} height={300} />
          <h1 className={styles.metadataName}>{metadata.name}</h1>
          <p className={styles.metadataDescription}>{metadata.description}</p>
        </div>
        </a>
      )}
      <h2 className={styles.topOwnersHeader}>Top 100 Owners</h2>
      <div className={styles.ownerListContainer}>
        {owners.map((owner, index) => (
            <a
            key={index}
            href={`https://zora.co/${owner.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ownerLink}
            >
            <div key={index} className={styles.ownerItem}>
                <div className={styles.ownerAvatarContainer}>
                <Avatar owner={owner} />
                </div>
                <div className={styles.ownerInfo}>
                <div className={styles.ownerName}>{owner.ensName || truncateAddress(owner.address)}</div>
                <div className={styles.ownerTokens}>{owner.tokenCount} tokens</div>
                </div>
            </div>
            </a>
        ))}
      </div>
    </div>
  );
  
};

function truncateAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export default ListPage;
