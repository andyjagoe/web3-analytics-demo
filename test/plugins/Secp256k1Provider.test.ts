import * as u8a from 'uint8arrays'
import { verifyJWS } from 'did-jwt'
import { randomBytes } from '@stablelib/random'
import type { GeneralJWS } from 'dids'
import elliptic from 'elliptic'
const EC = elliptic.ec;
const ec = new EC('secp256k1')

import { encodeDID, Secp256k1Provider } from '../src/plugins/Secp256k1Provider'


const b64urlToObj = (s: string): Record<string, any> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  JSON.parse(u8a.toString(u8a.fromString(s, 'base64url')))

describe('key-did-provider-secp256k1', () => {
  let provider: Secp256k1Provider
  let did: string
  let publicKey: Uint8Array

  beforeAll(() => {
    const seed = randomBytes(32)
    publicKey = Uint8Array.from(ec.keyFromPrivate(seed).getPublic(true, 'array'))
    provider = new Secp256k1Provider(seed)
    did = encodeDID(publicKey)
  })

  it('encodeDID', () => {
    const pubkey = u8a.fromString(
      'd713cb7f8624d8648496e01010f2bd72f0dcbbdecdb7036f38c20475f5f429bf',
      'base16'
    )
    expect(encodeDID(pubkey)).toMatchSnapshot()
  })

  it('has isDidProvider property', () => {
    expect(provider.isDidProvider).toEqual(true)
  })

  it('authenticates correctly', async () => {
    const nonce = 'adfberg'
    const aud = 'https://my.app'
    const paths = ['a', 'b']
    const resp = await provider.send({
      jsonrpc: '2.0',
      id: 0,
      method: 'did_authenticate',
      params: { nonce, aud, paths },
    })
    const jws = resp?.result as GeneralJWS
    const payload = b64urlToObj(jws.payload)
    const header = b64urlToObj(jws.signatures[0].protected)
    expect(payload.aud).toEqual(aud)
    expect(payload.nonce).toEqual(nonce)
    expect(payload.paths).toEqual(paths)
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000)
    expect(header.alg).toEqual('ES256K')
    expect(payload.did).toEqual(did)
    expect(header.kid).toEqual(expect.stringContaining(did))
  })

  it('signs JWS properly', async () => {
    const payload = { foo: 'bar' }
    const prot = { bar: 'baz' }
    const res = await provider.send({
      jsonrpc: '2.0',
      id: 0,
      method: 'did_createJWS',
      params: { payload, protected: prot, did },
    })
    const pubkey = {
      id: '',
      type: '',
      controller: '',
      publicKeyBase64: u8a.toString(publicKey, 'base64pad'),
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const gjws = res?.result?.jws as GeneralJWS
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const jws = [gjws.signatures[0].protected, gjws.payload, gjws.signatures[0].signature].join('.')
    expect(verifyJWS(jws, pubkey)).toEqual(pubkey)
  })

})
