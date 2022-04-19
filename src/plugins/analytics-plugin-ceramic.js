import { CeramicClient } from '@ceramicnetwork/http-client';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { TileLoader } from '@glazed/tile-loader'
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { DataModel } from '@glazed/datamodel'
import { DIDDataStore } from '@glazed/did-datastore'
import toast from 'react-hot-toast'
import modelAliases from './model.json'




// Set up Ceramic
const API_URL = 'https://ceramic-clay.3boxlabs.com'
//const API_URL = 'http://localhost:7007'
const ceramic = new CeramicClient(API_URL)

const cache = new Map()
const loader = new TileLoader({ ceramic, cache })
const model = new DataModel({ loader, model: modelAliases })
const dataStore = new DIDDataStore({ ceramic, loader, model })


export default function ceramicAnalytics(userConfig) {
  // plugin docs: https://getanalytics.io/plugins/writing-plugins/

  // `seed` must be a 32-byte long Uint8Array
  async function authenticateCeramic(seed) {
      const provider = new Ed25519Provider(seed)
      const did = new DID({ provider, resolver: getResolver() })

      // Authenticate the DID with the provider
      await did.authenticate()
      console.log(did);

      // The Ceramic client can create and update streams using the authenticated DID
      ceramic.did = did

      return did;
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
        events: [...events, { id: doc.id.toUrl(), title: payload.meta.rid }],
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
      
      const did = await authenticateCeramic(seed);
      localStorage.setItem('authenticatedDID', did.id);

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