import { CeramicClient } from '@ceramicnetwork/http-client';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import toast from 'react-hot-toast';


const API_URL = 'https://ceramic-clay.3boxlabs.com';
const ceramic = new CeramicClient(API_URL);


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


    async function sendToCeramic(payload, description, icon) {
        console.log(payload);

        const doc = await TileDocument.create(ceramic, payload);
        const key = shortenKey(doc.id.cid.string);
        toast(`${ description } saved in ceramic: ${ key }`, {
            icon: icon,
        });
        console.log(doc.id);
    
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
      

    // return object for analytics to use
    return {
      name: 'ceramic-analytics',
      config: {},
      initialize: async ({ config }) => {
        let seed;

        const ceramicSeed = JSON.parse(localStorage.getItem('ceramicSeed'));
        if (!ceramicSeed) {
            // create new seed
            seed = crypto.getRandomValues(new Uint8Array(32));
            localStorage.setItem('ceramicSeed', JSON.stringify(Array.from(seed)));
        } else {
            // use existing seed
            seed = new Uint8Array(JSON.parse(localStorage.getItem('ceramicSeed')));
        }

        const did = await authenticateCeramic(seed);
        localStorage.setItem('authenticatedDID', did.id);

        window.ceramicAnalyticsLoaded = true;
      },
      page: async ({ payload }) => {
        await sendToCeramic(payload, 'page view', '🚀');
      },
      track: async ({ payload }) => {
        await sendToCeramic(payload, 'track event', '👀');
      },
      identify: async ({ payload }) => {
        await sendToCeramic(payload, 'identify visitor event', '👩‍🌾');
      },
      loaded: () => {
        return !!window.ceramicAnalyticsLoaded;
      }
    }
}