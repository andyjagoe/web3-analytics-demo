import { CeramicClient } from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { TileLoader } from '@glazed/tile-loader'
import { DID } from 'dids';
import { Secp256k1Provider } from 'key-did-provider-secp256k1'
import { getResolver } from 'key-did-resolver'
import { DataModel } from '@glazed/datamodel'
import { DIDDataStore } from '@glazed/did-datastore'
import toast from 'react-hot-toast'
import { ethers } from "ethers"
import * as u8a from 'uint8arrays'
import modelAliases from './model.json'
import elliptic from 'elliptic'
import { RelayProvider } from "@opengsn/provider"
import Web3Analytics from "./Web3Analytics.json"
const EC = elliptic.ec;
const ec = new EC('secp256k1')
const Web3HttpProvider = require( 'web3-providers-http')



// Set up Ceramic
const CERAMIC_URL = process.env.CERAMIC_URL
const ceramic = new CeramicClient(CERAMIC_URL)

const cache = new Map()
const loader = new TileLoader({ ceramic, cache })
const model = new DataModel({ loader, model: modelAliases })
const dataStore = new DIDDataStore({ ceramic, loader, model })


export default function ceramicAnalytics(userConfig) {
  // plugin docs: https://getanalytics.io/plugins/writing-plugins/

  // `seed` must be a 32-byte long Uint8Array
  async function authenticateCeramic(seed) {
      const provider = new Secp256k1Provider(seed)
      console.log(provider)
      const did = new DID({ provider, resolver: getResolver() })
      console.log(did)

      // Authenticate the DID with the provider
      await did.authenticate()
      console.log(did);

      // The Ceramic client can create and update streams using the authenticated DID
      ceramic.did = did

      return did;
  }

  async function registerUser(privateKey, did) {
    const appId = process.env.APP_ID
    const nodeUrl = process.env.NODE_URL
    const web3analyticsAddress = process.env.WEB3ANALYTICS
    const paymasterAddress = process.env.PAYMASTER   


    const confRinkeby = await { 
      paymasterAddress: paymasterAddress,
      relayLookupWindowBlocks: 1e5,
      relayRegistrationLookupBlocks: 1e5,
      pastEventsQueryMaxPageSize: 2e4,
    }
    const confStandard = await { 
      paymasterAddress: paymasterAddress,
    }

    const web3provider = new 
      Web3HttpProvider(nodeUrl)

    let gsnProvider =
    await RelayProvider.newProvider({
      provider: web3provider,
      config: confStandard }).init()

    const signer = new ethers.Wallet(privateKey)
    gsnProvider.addAccount(signer.privateKey)

    const provider = new ethers.providers.Web3Provider(gsnProvider)

    const contract = await new
    ethers.Contract(web3analyticsAddress, Web3Analytics,
      provider.getSigner(signer.address, signer.privateKey))

    const transaction = await contract.addUser(
      did, 
      appId,
      {gasLimit: 1e6}
    )
    console.log(transaction)
    const receipt = await provider.waitForTransaction(transaction.hash)
    console.log(receipt)

  }

  async function sendEventToCeramic(payload, description, icon) {
    console.log(payload);

    // Update Ceramic
    const [doc, eventsList] = await Promise.all([
        model.createTile('Event', payload),
        dataStore.get('events'),
      ])
    const events = eventsList?.events ?? []
    await dataStore.set('events', {
        events: [...events, { id: doc.id.toUrl(), updated_at: doc.content.meta.ts }],
    })

    // Report update to UI and console
    const docID = doc.id.toString()
    toast(`${ description } saved in ceramic: ${ shortenKey(docID) }`, {
        icon: icon,
    });
    console.log(`New document id: ${docID}`)

    // Load pages to verify they increased
    const newEvents = await dataStore.get('events')
    console.log(newEvents)

    // Load Page to verify it was added correctly
    const retrieved = await TileDocument.load(ceramic, doc.id);
    console.log(retrieved.content);

  }

  function shortenKey(key) {
      if (key != null) {
        const beginning = key.substring(0,4);
        const keyLength = key.length;
        const end = key.substring(keyLength-4,keyLength)
        return `${beginning}...${end}`;
      }
      return '';
  }
  
    
  // Return object for analytics to use
  return {
    name: 'ceramic-analytics',
    config: {},
    initialize: async ({ config }) => {
      let seed;

      const ceramicSeed = JSON.parse(localStorage.getItem('ceramicSeed'));
      if (!ceramicSeed) {
          // Create new seed
          seed = crypto.getRandomValues(new Uint8Array(32));
          localStorage.setItem('ceramicSeed', JSON.stringify(Array.from(seed)));
      } else {
          // Use existing seed
          seed = new Uint8Array(JSON.parse(localStorage.getItem('ceramicSeed')));
      }
      
      const privateKey = "0x"+ u8a.toString(seed, 'base16')

      // Authenticate Ceramic
      const did = await authenticateCeramic(seed);
      localStorage.setItem('authenticatedDID', did.id);

      //TODO: Add check to see if user is already registered on blockchain

      // attempt to register user on blockchain
      registerUser(privateKey, did.id);
      
      // Load tracked events
      const newEvents = await dataStore.get('events')
      console.log(newEvents)  

      window.ceramicAnalyticsLoaded = true;
    },
    page: async ({ payload }) => {
      await sendEventToCeramic(payload, 'page view', '🚀');
    },
    track: async ({ payload }) => {
      await sendEventToCeramic(payload, 'track event', '👀');
    },
    identify: async ({ payload }) => {
      await sendEventToCeramic(payload, 'identify visitor event', '👩‍🌾');
    },
    loaded: () => {
      return !!window.ceramicAnalyticsLoaded;
    }
  }
}