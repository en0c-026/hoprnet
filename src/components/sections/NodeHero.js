import React from 'react'
import PropTypes from 'prop-types'
import GenericSection from './GenericSection'
import Image from '../elements/Image'
import { SectionProps } from '../../utils/SectionProps'

const propTypes = {
  children: PropTypes.node,
  ...SectionProps.types,
}

const defaultProps = {
  children: null,
  ...SectionProps.defaults,
}

const NodeHero = props => {
  const oddSections = {
    hasBgColor: props.hasBgColor,
    invertColor: props.invertColor,
  }

  const evenSections = {
    hasBgColor: !oddSections.hasBgColor,
    invertColor: !oddSections.invertColor,
  }

  return (
    <>
      <GenericSection {...oddSections}>
        <div className="center-content">
          <div
            className="container-sm"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* <h2 className="section-header mt-0 mb-0 reveal-from-top" data-reveal-delay="150">
            HOPR nodes:
          </h2> */}
            <div className="mb-32 hero-figure reveal-from-top" data-reveal-delay="200">
              <Image
                className="has-shadow"
                src={require('../../assets/images/hopr-illustration-small.png')}
                alt="Hero"
                width={896}
                height={504}
                style={{
                  borderRadius: '15px',
                }}
              />
            </div>
            {/* <div className="pt-32 reveal-from-top" data-reveal-delay="300">
            We're a team of highly motivated experts with a single shared goal:
            <br />
            universal data privacy.
            <br />
            <br />
            We know that this is an ambitious and difficult target, and we won't be able to achieve it alone, but we
            believe HOPR can provide a significant and essential piece of the puzzle, ready for others to build on.
            <br />
            <br />
            Our vision is a world where privacy is available for anyone and everyone who wants it.
          </div> */}
          </div>
        </div>
      </GenericSection>
      <GenericSection id="mining_pc" {...oddSections}>
        <div className="center-content">
          <div className="container-sm">
            <h2 className="section-header mt-0 mb-0 reveal-from-top" data-reveal-delay="150">
              Mining PC:
            </h2>
            <div className="container reveal-from-top" data-reveal-delay="300">
              The HOPR privacy network relies on a globally distributed network of mix nodes. To support and rapidly
              grow the community running this network, HOPR will release a plug-and-earn mix node on a mini PC. Open
              incentivization allows anyone to run a HOPR node, stake and get rewarded with HOPR tokens while providing
              privacy for Web3.
              <br />
              To be added to the “Defenders of Privacy” node runners waitlist, find out more here:
            </div>
          </div>
        </div>
      </GenericSection>
      <GenericSection id="order" {...evenSections}>
        <div className="center-content">
          <div className="container-sm">
            {/* <SectionHeader
          data={{
            title: 'HOPR node order:',
            paragraph: undefined,
          }}
        /> */}
            <iframe
              title="Order a HOPR node"
              src="https://docs.google.com/forms/d/e/1FAIpQLSc-3tJTsrJtxFD4B9DwaY6V3165Z0sicut4yb9D4NryqsRJhQ/viewform?embedded=true"
              width="700"
              height="650"
              frameBorder="0"
              marginHeight="0"
              marginWidth="0"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </GenericSection>
      <GenericSection id="remarks" {...oddSections}>
        <div className="center-content">
          <div className="container-sm">
            <h2 className="section-header mt-0 mb-0 reveal-from-top" data-reveal-delay="150">
              REMARKS:
            </h2>

            <ol style={{ textAlign: 'left' }}>
              <li>
                Add your name to ensure you are one of the first to be notified about details of HOPR nodes, including
                availability, specifications, price, and shipment dates.
              </li>
              <li>
                Subscribing does NOT guarantee delivery of a HOPR node. You will receive an email in mid-July, after
                which you will be able to purchase a HOPR node. (naturally, you can also install and run a HOPR node on
                a device of your choice)
              </li>
            </ol>

            <h4>(naturally, you can also install and run a HOPR node on a device of your choice)</h4>
          </div>
        </div>
      </GenericSection>
      <GenericSection id="bounties" {...evenSections}>
        <div className="center-content">
          <div className="container-sm">
            Jump the waitlist:
            <h2 className="section-header mt-0 mb-0 reveal-from-top" data-reveal-delay="150">
              Gitcoin Bounties:
            </h2>
            Why wouldn't you get paid for developing open source software? Check out our bounties on Gitcoin - some are
            fairly beginner-friendly while some require more in-depth knowledge of the HOPR protocol. HOPR is built by
            the community for the community <span className="text-color-high">(coming mid-July 2020)</span>.
            <br />
            <br />
            The positive side-effect. Participating in Bounties makes you end up on top of the waitlist.
          </div>
        </div>
      </GenericSection>
      <GenericSection id="bounties" {...oddSections}>
        <div className="center-content">
          <div className="container-sm">
            <h2 className="section-header mt-0 mb-0 reveal-from-top" data-reveal-delay="150">
              Enabling Data Privacy:
            </h2>
            We're past the tipping point for privacy. Lack of privacy isn't just a problem for individuals suffering at
            the hands of data harvesting social media giants. Data privacy has become a major societal and economic
            issue requiring government intervention and the creation of entire compliance departments.
            <br />
            <br />
            GDPR, HIIPA, CCPA and other regulation is like a band-aid on a broken leg. At HOPR, we're building the
            foundations for a whole new approach: privacy infrastructure that can be used by corporations and
            individuals to build privacy-first applications and services on the web or blockchain.
            <br />
            <br />
            The HOPR protocol provides network-level and metadata privacy for every kind of data exchange. A mixnet
            protects the identity of both sender and recipient by routing data via relayers who mix traffic and earn
            HOPR tokens for their efforts.
          </div>
        </div>
      </GenericSection>
    </>
  )
}

NodeHero.propTypes = propTypes
NodeHero.defaultProps = defaultProps

export default NodeHero
