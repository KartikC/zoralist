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

const ListPage = () => {
  const [owners, setOwners] = useState<Owner[]>([]);

  // Fetch data from your API on component mount
  useEffect(() => {
    fetch('/api/list?contract=0x72d07beebb80f084329da88063f5e52f70f020a3&token=1&limit=100')
      .then(response => response.json())
      .then(data => {
        setOwners(data.owners);
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
    <div className={styles.ownerListContainer}>
      {owners.map((owner, index) => (
        <div key={index} className={styles.ownerItem}>
          <div className={styles.ownerAvatarContainer}>
            {getAvatar(owner)}
          </div>
          <div className={styles.ownerInfo}>
            <div className={styles.ownerName}>{owner.ensName || truncateAddress(owner.address)}</div>
            <div className={styles.ownerTokens}>{owner.tokenCount} tokens</div>
          </div>
        </div>
      ))}
    </div>
  );
};

function truncateAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export default ListPage;
