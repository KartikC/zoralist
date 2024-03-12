import { useEffect, useState } from 'react';
import * as jdenticon from 'jdenticon';
import styles from '../../styles/ListPage.module.css'; // Import the CSS module

// Define the shape of the data you expect
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

const ListPage = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);


  // Fetch data from your API on component mount
  useEffect(() => {
    fetch('/api/list?contract=0x72d07beebb80f084329da88063f5e52f70f020a3&token=1&limit=100')
      .then(response => response.json())
      .then(data => {
        setOwners(data.owners);
        setMetadata(data.metadata); // Assuming the API returns metadata as well
      });
  }, []);

  const getAvatar = (owner: Owner) => {
    if (owner.avatarUrl) {
      return <img src={owner.avatarUrl} alt="Avatar" className={styles.ownerAvatar} />;
    } else {
      // Create a data URI for an SVG identicon
      const identiconSvg = jdenticon.toSvg(owner.address, 40);
      return <img src={`data:image/svg+xml;utf8,${encodeURIComponent(identiconSvg)}`} alt="Identicon" className={styles.ownerAvatar} />;
    }
  };

  return (
    <div className={styles.container}>
      {metadata && (
        <div className={styles.collectionMetadata}>
          <img src={metadata.image} alt={metadata.name} className={styles.metadataImage} />
          <h1 className={styles.metadataName}>{metadata.name}</h1>
          <p className={styles.metadataDescription}>{metadata.description}</p>
        </div>
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
                {getAvatar(owner)}
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
