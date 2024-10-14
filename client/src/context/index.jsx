import React, { useContext, createContext } from 'react';
import { ethers } from 'ethers';
import abi from '../constants/abi.json';
const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contractAddress = 'YOUR_CONTRACT_ADDRESS';

  const contract = new ethers.Contract(contractAddress, abi, signer);

  const address = signer.getAddress();

  const connect = async () => {
    try {
      await provider.send('eth_requestAccounts', []);
    } catch (error) {
      console.error('Error connecting to Metamask:', error);
    }
  };

  const publishCampaign = async (form) => {
    try {
      // Ensure form.target is a string
      const targetInWei = ethers.utils.parseUnits(form.target.toString(), 18);
  
      const data = await createCampaign({
        args: [
          address, // owner
          form.title, // title
          form.description, // descriptione
          targetInWei, // target converted to Wei
          new Date(form.deadline).getTime(), // deadline
          form.image, // image URL
        ],
      });
  
      console.log("contract call success", data);
    } catch (error) {
      console.error("contract call failure", error);
    }
  };
  
  const getCampaigns = async () => {
    const campaigns = await contract.getCampaigns();
    const parsedCampaigns = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i
    }));
    return parsedCampaigns;
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);
    return filteredCampaigns;
  };

  const donate = async (pId, amount) => {
    try {
      const transaction = await contract.donateToCampaign(pId, {
        value: ethers.utils.parseEther(amount)
      });
      await transaction.wait();
      console.log('Donation successful');
    } catch (error) {
      console.error('Donation failed:', error);
    }
  };

  const getDonations = async (pId) => {
    const donations = await contract.getDonators(pId);
    const numberOfDonations = donations[0].length;
    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString())
      });
    }

    return parsedDonations;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
