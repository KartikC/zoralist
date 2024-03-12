import { useEffect, useState } from 'react';
import * as jdenticon from 'jdenticon';

interface Owner {
  address: string;
  tokenCount: string;
  ensName: string | null;
  avatarUrl: string | null;
}

const ListPage = () => {
  const [owners, setOwners] = useState<Owner[]>([]);

  useEffect(() => {
    fetch('/api/list?contract=0x72d07beebb80f084329da88063f5e52f70f020a3&token=1&limit=100')
      .then((response) => response.json())
      .then((data) => {
        setOwners(data.owners);
        // Update identicons once owners are set
        data.owners.forEach((owner: Owner) => {
          jdenticon.update(`#identicon-${owner.address}`, owner.address);
        });
      });
  }, []);

  const truncateAddress = (address: string) => `${address.substr(0, 6)}...${address.substr(-4)}`;

  return (
    <div style={{ padding: '20px' }}>
      {owners.map((owner, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
          {owner.avatarUrl ? (
            <img
              src={owner.avatarUrl}
              alt="Avatar"
              style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null; // prevents looping
                currentTarget.src='/placeholder.png'; // replace with your placeholder image path
              }}
            />
          ) : (
            <svg width="50" height="50" data-jdenticon-value={owner.address} id={`identicon-${owner.address}`}></svg>
          )}
          <div>
            <div>{owner.ensName || truncateAddress(owner.address)}</div>
            <div>{owner.tokenCount} tokens</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListPage;
