import type { providers as Providers, Wallet } from 'ethers'
import type { HoprChannels } from '@hoprnet/hopr-ethereum'
import type { Event } from './types'
import type { ChainWrapper } from '../ethereum'
import assert from 'assert'
import EventEmitter from 'events'
import Indexer from '.'
import { stringToU8a, Address, ChannelEntry, Hash, HoprDB, generateChannelId } from '@hoprnet/hopr-utils'
import { expectAccountsToBeEqual, expectChannelsToBeEqual } from './fixtures'
import Defer from 'p-defer'
import * as fixtures from './fixtures'
import { CHANNEL_ID, PARTY_A, PARTY_B } from '../fixtures'
import { BigNumber } from 'ethers'

const createProviderMock = (ops: { latestBlockNumber?: number } = {}) => {
  let latestBlockNumber = ops.latestBlockNumber ?? 0

  const provider = new EventEmitter() as unknown as Providers.WebSocketProvider
  provider.getBlockNumber = async (): Promise<number> => latestBlockNumber

  return {
    provider,
    newBlock() {
      latestBlockNumber++
      provider.emit('block', latestBlockNumber)
    }
  }
}

const createHoprChannelsMock = (ops: { pastEvents?: Event<any>[] } = {}) => {
  const pastEvents = ops.pastEvents ?? []

  class FakeChannels extends EventEmitter {
    async channels(channelId: string) {
      return pastEvents.reduceRight((acc, event: Event<any>) => {
        if (acc.length > 0) {
          // Only take most recent event
          return acc
        }

        if (event.event !== 'ChannelUpdate') {
          return acc
        }

        const updateEvent = event as Event<'ChannelUpdate'>

        const eventChannelId = generateChannelId(
          Address.fromString(updateEvent.args.source),
          Address.fromString(updateEvent.args.destination)
        )

        if (new Hash(stringToU8a(channelId)).eq(eventChannelId)) {
          return [updateEvent.args.newState]
        }
      }, [])[0]
    }

    async bumpChannel(_counterparty: string, _comm: string) {
      let newEvent = {
        event: 'ChannelUpdate',
        transactionHash: '',
        blockNumber: 3,
        transactionIndex: 0,
        logIndex: 0,
        args: {
          source: PARTY_A.toAddress().toHex(),
          destination: PARTY_B.toAddress().toHex(),
          newState: {
            balance: BigNumber.from('3'),
            commitment: Hash.create(new TextEncoder().encode('commA')).toHex(),
            ticketEpoch: BigNumber.from('1'),
            ticketIndex: BigNumber.from('0'),
            status: 2,
            channelEpoch: BigNumber.from('0'),
            closureTime: BigNumber.from('0')
          }
        } as any
      } as Event<'ChannelUpdate'>
      pastEvents.push(newEvent)
      this.emit('*', newEvent)
    }

    async queryFilter() {
      return pastEvents
    }
  }

  const hoprChannels = new FakeChannels() as unknown as HoprChannels

  return {
    hoprChannels,
    newEvent(event: Event<any>) {
      pastEvents.push(event)
      hoprChannels.emit('*', event)
    }
  }
}

const createChainMock = (
  provider: Providers.WebSocketProvider,
  hoprChannels: HoprChannels,
  account?: Wallet
): ChainWrapper => {
  return {
    getLatestBlockNumber: () => provider.getBlockNumber(),
    subscribeBlock: (cb) => provider.on('block', cb),
    subscribeError: (cb) => {
      provider.on('error', cb)
      hoprChannels.on('error', cb)
    },
    subscribeChannelEvents: (cb) => hoprChannels.on('*', cb),
    unsubscribe: () => {
      provider.removeAllListeners()
      hoprChannels.removeAllListeners()
    },
    getChannels: () => hoprChannels,
    getWallet: () => account ?? fixtures.ACCOUNT_A,
    setCommitment: (counterparty: Address, commitment: Hash) =>
      hoprChannels.bumpChannel(counterparty.toHex(), commitment.toHex())
  } as unknown as ChainWrapper
}

const useFixtures = (ops: { latestBlockNumber?: number; pastEvents?: Event<any>[] } = {}) => {
  const latestBlockNumber = ops.latestBlockNumber ?? 0
  const pastEvents = ops.pastEvents ?? []

  const db = HoprDB.createMock()
  const { provider, newBlock } = createProviderMock({ latestBlockNumber })
  const { hoprChannels, newEvent } = createHoprChannelsMock({ pastEvents })
  const chain = createChainMock(provider, hoprChannels)

  const indexer = new Indexer(0, db, chain, 1, 5)

  return {
    db,
    provider,
    newBlock,
    hoprChannels,
    newEvent,
    indexer
  }
}

const useMultiPartyFixtures = (ops: { latestBlockNumber?: number; pastEvents?: Event<any>[] } = {}) => {
  const latestBlockNumber = ops.latestBlockNumber ?? 0
  const pastEvents = ops.pastEvents ?? []

  const db = HoprDB.createMock()
  const { provider, newBlock } = createProviderMock({ latestBlockNumber })
  const { hoprChannels, newEvent } = createHoprChannelsMock({ pastEvents })

  const chainAlice = createChainMock(provider, hoprChannels, fixtures.ACCOUNT_A)
  const chainBob = createChainMock(provider, hoprChannels, fixtures.ACCOUNT_B)

  const indexerAlice = new Indexer(0, db, chainAlice, 1, 5)
  const indexerBob = new Indexer(0, db, chainBob, 1, 5)

  return {
    db,
    provider,
    newBlock,
    hoprChannels,
    newEvent,
    alice: {
      indexer: indexerAlice
    },
    bob: {
      indexer: indexerBob
    }
  }
}

describe('test indexer', function () {
  it('should start indexer', async function () {
    const { indexer } = useFixtures()

    await indexer.start()
    assert.strictEqual(indexer.status, 'started')
  })

  it('should stop indexer', async function () {
    const { indexer } = useFixtures()

    await indexer.start()
    await indexer.stop()
    assert.strictEqual(indexer.status, 'stopped')
  })

  it('should process 1 past event', async function () {
    const { indexer } = useFixtures({
      latestBlockNumber: 2,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT, fixtures.OPENED_EVENT]
    })
    await indexer.start()

    const account = await indexer.getAccount(fixtures.PARTY_A.toAddress())
    expectAccountsToBeEqual(account, fixtures.PARTY_A_INITIALIZED_ACCOUNT)

    const channel = await indexer.getChannel(fixtures.OPENED_CHANNEL.getId())
    assert.strictEqual(typeof channel, 'undefined')
  })

  it('should process all past events', async function () {
    const { indexer } = useFixtures({
      latestBlockNumber: 3,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT, fixtures.OPENED_EVENT]
    })
    await indexer.start()

    const account = await indexer.getAccount(fixtures.PARTY_A.toAddress())
    expectAccountsToBeEqual(account, fixtures.PARTY_A_INITIALIZED_ACCOUNT)

    const channel = await indexer.getChannel(fixtures.OPENED_CHANNEL.getId())
    expectChannelsToBeEqual(channel, fixtures.OPENED_CHANNEL)
  })

  it('should continue processing events', async function () {
    const { indexer, newEvent, newBlock } = useFixtures({
      latestBlockNumber: 3,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT, fixtures.OPENED_EVENT]
    })
    await indexer.start()

    newEvent(fixtures.OPENED_EVENT)
    newBlock()

    const blockMined = Defer()

    indexer.on('block-processed', (blockNumber: number) => {
      if (blockNumber === 4) blockMined.resolve()
    })

    await blockMined.promise

    const channel = await indexer.getChannel(fixtures.OPENED_CHANNEL.getId())
    expectChannelsToBeEqual(channel, fixtures.OPENED_CHANNEL)
  })

  it('should get public key of addresses', async function () {
    const { indexer } = useFixtures({
      latestBlockNumber: 2,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT]
    })

    await indexer.start()

    const pubKey = await indexer.getPublicKeyOf(fixtures.PARTY_A.toAddress())
    assert.strictEqual(pubKey.toHex(), fixtures.PARTY_A.toHex())
  })

  it('should get all data from DB', async function () {
    const { indexer } = useFixtures({
      latestBlockNumber: 4,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT, fixtures.OPENED_EVENT]
    })

    await indexer.start()

    const account = await indexer.getAccount(fixtures.PARTY_A.toAddress())
    expectAccountsToBeEqual(account, fixtures.PARTY_A_INITIALIZED_ACCOUNT)

    const channel = await indexer.getChannel(fixtures.OPENED_CHANNEL.getId())
    expectChannelsToBeEqual(channel, fixtures.OPENED_CHANNEL)

    const channels = await indexer.getChannels()
    assert.strictEqual(channels.length, 1, 'expected channels')
    expectChannelsToBeEqual(channels[0], fixtures.OPENED_CHANNEL)

    const channelsFromPartyA = await indexer.getChannelsFrom(fixtures.PARTY_A.toAddress())
    assert.strictEqual(channelsFromPartyA.length, 1)
    expectChannelsToBeEqual(channelsFromPartyA[0], fixtures.OPENED_CHANNEL)

    const channelsOfPartyB = await indexer.getChannelsFrom(fixtures.PARTY_B.toAddress())
    assert.strictEqual(channelsOfPartyB.length, 0)
  })

  it('should handle provider error by restarting', async function () {
    const { indexer, provider } = useFixtures({
      latestBlockNumber: 4,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT, fixtures.OPENED_EVENT]
    })

    await indexer.start()

    provider.emit('error', new Error('MOCK'))

    assert.strictEqual(indexer.status, 'stopped')

    const started = Defer()
    indexer.on('status', (status: string) => {
      if (status === 'started') started.resolve()
    })
    await started.promise
    assert.strictEqual(indexer.status, 'started')
  })

  it('should contract error by restarting', async function () {
    const { indexer, hoprChannels } = useFixtures({
      latestBlockNumber: 4,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT, fixtures.OPENED_EVENT]
    })

    await indexer.start()

    hoprChannels.emit('error', new Error('MOCK'))

    const started = Defer()
    indexer.on('status', (status: string) => {
      if (status === 'started') started.resolve()
    })
    await started.promise
    assert.strictEqual(indexer.status, 'started')
  })

  it('should emit events on updated channels', async function () {
    this.timeout(5000)
    const { indexer, newEvent, newBlock } = useFixtures({
      latestBlockNumber: 3,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT]
    })

    const opened = Defer()
    const commitmentSet = Defer()
    const pendingIniated = Defer()
    const closed = Defer()

    indexer.on('own-channel-updated', (channel: ChannelEntry) => {
      switch (channel.status) {
        case 'WAITING_FOR_COMMITMENT':
          opened.resolve()
          break
        case 'OPEN':
          commitmentSet.resolve()
          break
        case 'PENDING_TO_CLOSE': {
          pendingIniated.resolve()
          break
        }
        case 'CLOSED': {
          closed.resolve()
          break
        }
      }
    })

    await indexer.start()
    const ev = {
      event: 'ChannelUpdate',
      transactionHash: '',
      blockNumber: 2,
      transactionIndex: 0,
      logIndex: 0,
      args: {
        source: PARTY_B.toAddress().toHex(),
        destination: PARTY_A.toAddress().toHex(),
        newState: {
          balance: BigNumber.from('3'),
          commitment: new Hash(new Uint8Array({ length: Hash.SIZE })).toHex(),
          ticketEpoch: BigNumber.from('0'),
          ticketIndex: BigNumber.from('0'),
          status: 1,
          channelEpoch: BigNumber.from('0'),
          closureTime: BigNumber.from('0')
        }
      } as any
    } as Event<'ChannelUpdate'>
    // We are ACCOUNT_A - if B opens a channel to us, we should automatically
    // commit.
    newEvent(ev)

    newBlock()
    newBlock()
    await opened.promise
    newBlock()
    newBlock()
    await commitmentSet.promise

    const evClose = {
      event: 'ChannelUpdate',
      transactionHash: '',
      blockNumber: 5,
      transactionIndex: 0,
      logIndex: 0,
      args: {
        source: PARTY_B.toAddress().toHex(),
        destination: PARTY_A.toAddress().toHex(),
        newState: {
          balance: BigNumber.from('3'),
          commitment: Hash.create(new TextEncoder().encode('commA')).toHex(),
          ticketEpoch: BigNumber.from('1'),
          ticketIndex: BigNumber.from('0'),
          status: 3,
          channelEpoch: BigNumber.from('0'),
          closureTime: BigNumber.from('0'),
          closureByPartyA: true
        }
      } as any
    } as Event<'ChannelUpdate'>
    newEvent(evClose)
    newBlock()
    newBlock()

    await pendingIniated.promise

    const evClosed = {
      event: 'ChannelUpdate',
      transactionHash: '',
      blockNumber: 7,
      transactionIndex: 0,
      logIndex: 0,
      args: {
        source: PARTY_B.toAddress().toHex(),
        destination: PARTY_A.toAddress().toHex(),
        newState: {
          balance: BigNumber.from('0'),
          commitment: new Hash(new Uint8Array({ length: Hash.SIZE })).toHex(),
          ticketEpoch: BigNumber.from('0'),
          ticketIndex: BigNumber.from('0'),
          status: 0,
          channelEpoch: BigNumber.from('0'),
          closureTime: BigNumber.from('0'),
          closureByPartyA: false
        }
      } as any
    } as Event<'ChannelUpdate'>

    newEvent(evClosed)
    newBlock()
    newBlock()

    await closed.promise
  })

  it('should start two indexers and should set commitments only once', async function () {
    const { alice, bob, newBlock } = useMultiPartyFixtures({
      latestBlockNumber: 3,
      pastEvents: [fixtures.PARTY_A_INITIALIZED_EVENT, fixtures.PARTY_B_INITIALIZED_EVENT, fixtures.OPENED_EVENT]
    })

    await Promise.all([alice.indexer.start(), bob.indexer.start()])

    newBlock()
    newBlock()
    newBlock()

    await Promise.all([
      alice.indexer.waitForCommitment(new Hash(stringToU8a(CHANNEL_ID))),
      bob.indexer.waitForCommitment(new Hash(stringToU8a(CHANNEL_ID)))
    ])
  })
})
