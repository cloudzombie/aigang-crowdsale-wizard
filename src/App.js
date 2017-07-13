import React, { Component } from 'react'
import Presale from './contract_abi/Presale.json'
import Token from './contract_abi/Token.json'
import getWeb3 from './utils/getWeb3'
import './css/fabrik.css'
import './App.css'

const Header = () => {
  return (
    <nav id="nav" className="navbar pure-g pure-menu pure-menu-horizontal">
      <div className="pure-u-1 pure-u-md-1-3 pure-u-lg-1-3">
        <a href="https://aigang.network/" className="pure-menu-heading pure-menu-link pure-img site-logo" ></a>
      </div>
      <div className="pure-u-1 pure-u-md-1-3 pure-u-lg-1-3 header-middle">
        <h1>Presale Investment</h1>
      </div>
      <div className="pure-u-1 pure-u-md-1-3 pure-u-lg-1-3 header-right">
        <a href="https://github.com/AigangNetwork" target="_blank" className="pure-menu-link fa fa-github fa-2x"></a>
        <a href="https://medium.com/aigang-network" target="_blank" className="pure-menu-link fa fa-medium fa-2x"></a>
        <a href="https://t.me/aigangnetwork" target="_blank" className="pure-menu-link fa fa-telegram fa-2x"></a>
        <a href="http://slack.aigang.network/" target="_blank" className="pure-menu-link fa fa-slack fa-2x"></a>
      </div>
    </nav>
  )
}

class Table extends Component {
  componentWillUpdate(nextProps, nextState) {
    if (this.refs.copyBtn) {
      const Clipboard = require('clipboard');
      this.clipboard = new Clipboard(this.refs.copyBtn);
    }
  }

  render() {
    const domain = this.props.netIdName === "mainnet" ? '' : this.props.netIdName + '.'
    const currentAccountLink = `https://${domain}etherscan.io/address/${this.props.currentAccount}`
    const crowdsaleAddressLink = `https://${domain}etherscan.io/address/${this.props.crowdsaleAddress}`
    const onCopyClick = () => {
    }
    let balanceRow, copyBtn
    if (this.props.injectedWeb3) {
      balanceRow = (<tr>
        <td>Your investment balance</td>
        <td>{this.props.balance} {this.props.tokenSymbol}</td>
      </tr>)
    }
    return (
      <div className="pure-u-1 pure-u-lg-18-24 pure-u-md-2-4">
        <table className="pure-table pure-table-horizontal">
          <tbody>
            <tr>
              <td><b>Pre-sale target</b></td>
              <td>
                {this.props.presaleTarget} ETH
            </td>
            </tr>

            <tr>
              <td>Your wallet address</td>
              <td>
                <a href={currentAccountLink} target="_blank">{this.props.currentAccount}</a>
              </td>
            </tr>

            <tr>
              <td>Presale Contract Address</td>
              <td><a href={crowdsaleAddressLink} target="_blank">{this.props.crowdsaleAddress}</a>
                <i ref="copyBtn" onClick={onCopyClick} data-clipboard-text={this.props.crowdsaleAddress} className="fa fa-files-o fa-border" aria-hidden="true"></i>
              </td>
            </tr>

            <tr>
              <td>Total Invested</td>
              <td>
                {this.props.totalInvested} ETH
            </td>
            </tr>

            <tr>
              <td>Price per AIT</td>
              <td>{this.props.pricePerAit} ETH</td>
            </tr>
            <tr>
              <td>Investor bonus in the crowdsale</td>
              <td>{this.props.investorBonus}%</td>
            </tr>
            {balanceRow}
          </tbody>
        </table>
      </div>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    this.onClickBuy = this.onClickBuy.bind(this)
    this.presaleAddress = '0xBef0Cd92aA215348A33B9F8E5263793760dFe8c5'
    this.state = {
      web3: null,
      netIdName: null,
      disabledBtn: false,
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.injectedWeb3 = results.injectedWeb3;
        this.setState({
          web3: results.web3,
          netIdName: results.netIdName,
          disabledBtn: !results.injectedWeb3
        })

        // Instantiate contract once web3 provided.
        // this.instantiateContract()
        this.instantiatePresaleContract()
      })
      .catch(() => {
        console.log('Error finding web3.')
      })
  }

  instantiatePresaleContract() {
    const contract = require('truffle-contract')
    const presale = contract({
      abi: Presale,
    })
    const token = contract({
      abi: Token,
    })
    presale.setProvider(this.state.web3.currentProvider)
    token.setProvider(this.state.web3.currentProvider)
    let presaleInstance;
    let presaleTarget, currentAccount, crowdsaleAddress, totalInvested, pricePerAit, investorBonus, balance, tokenSymbol;
    this.state.web3.eth.getAccounts((error, accounts) => {
      presale.at(this.presaleAddress).then((instance) => {
        this.presaleInstance = instance;
        console.log(this.presaleInstance);
        return instance.totalSupplyCap.call()
      }).then((_totalSupplyCap) => {
        presaleTarget = this.state.web3.fromWei(_totalSupplyCap.toNumber(), 'ether')
        return this.presaleInstance.ait()
      })
        .then((_token) => {
          this.tokenInstance = token.at(_token)
          console.log(this.tokenInstance, "TOKEN INS")
          return this.presaleInstance.totalSold.call()
        })
        .then((_totalSold) => {
          totalInvested = this.state.web3.fromWei(_totalSold.toNumber(), 'ether')
          return this.presaleInstance.exchangeRate.call()
        })
        .then((_exchange) => {
          pricePerAit = _exchange.toNumber()
          return this.presaleInstance.investor_bonus.call()
        })
        .then((_investorBonus) => {
          investorBonus = _investorBonus.toNumber()
          return this.tokenInstance.symbol.call()
        })
        .then((_symbol) => {
          tokenSymbol = _symbol
          this.updateBalance(accounts[0]);
          this.setState({
            currentAccount: accounts[0],
            presaleTarget, totalInvested, pricePerAit, investorBonus, balance, tokenSymbol,
          })
        })
    })

  }

  updateBalance(account) {
    console.log('updateBalance')
    return this.tokenInstance.balanceOf.call(account).then((balance) => {
      balance = this.state.web3.fromWei(balance.toNumber(), 'ether')
      this.setState({ balance })
    })
  }

  checkTransaction(txId) {
    this.state.web3.eth.getTransaction(txId, (error, res) => {
      if (res.blockHash) {
        console.log('mined!', res.blockNumber)
        this.updateBalance(this.state.currentAccount);
        this.setState({ disabledBtn: false })
      } else {
        console.log('Not mined yet')
        this.checkTransaction(txId)
      }
    })
  }

  onClickBuy() {
    let amount = Number(this.refs.amount.value);
    if (!isNaN(amount)) {
      this.setState({ disabledBtn: true })
      amount = this.state.web3.toWei(amount, 'ether');
      this.presaleInstance.sendTransaction({ value: amount, from: this.state.currentAccount }).then((result) => {
        console.log(result);
        setTimeout(this.checkTransaction.bind(this, result.tx), 5);
      })
        .catch((error) => {
          console.error(error.message)
          const rejectedCLicked = error.message.includes('User denied transaction signature')
          if (rejectedCLicked) {
            this.setState({ disabledBtn: false })
          }

        })
    }
  }

  render() {

    const disabledBtn = this.state.disabledBtn;
    let txId, txStatus;
    if (this.state.txId) {
      txId = (<tr>
        <td>TransactionID</td>
        <td>{this.state.txId}</td>
      </tr>)
      txStatus = (<tr>
        <td>Transaction Status </td>
        <td>{this.state.txStatus}</td>
      </tr>)
    }
    return (
      <div className="App">
        <Header />
        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1 pure-u-md-1-1">
              <h1 className="purple font-50">
                Let's build it together!
              </h1>
            </div>
            <div className="pure-u-1 pure-u-md-1-1 pure-u-lg-18-24">
              <p className="lightGrey">
                Invest directly from your <a className="purple bold-link" href="https://metamask.io" target="_blank">metamask</a> account by selecting the amount and clicking invest, or copy
                the address and send Ethers from any other wallet.
                </p>
            </div>
          </div>
          <div className="pure-g">
            <Table
              presaleTarget={this.state.presaleTarget}
              currentAccount={this.state.currentAccount}
              crowdsaleAddress={this.presaleAddress}
              totalInvested={this.state.totalInvested}
              pricePerAit={this.state.pricePerAit}
              investorBonus={this.state.investorBonus}
              balance={this.state.balance}
              tokenSymbol={this.state.tokenSymbol}
              netIdName={this.state.netIdName}
              injectedWeb3={this.injectedWeb3}
            />
            <div className="pure-u-1 pure-u-lg-1-24">
            </div>
            <div className="pure-u-1 pure-u-lg-5-24 pure-u-md-1 form-container">
              <form className="pure-form pure-form-aligned">
                <div style={{ marginBottom: '15px' }}>Choose amount to invest</div>
                <input id="amount" className="pure-input-2-3" ref="amount" type="number" step="0.00001" placeholder="0" />
                <button id="buy" className="pure-button pure-button-primary pure-input-1-3" disabled={disabledBtn} onClick={this.onClickBuy}>INVEST</button>
              </form>
              <h4>Requirements</h4>
              <div className="lightGrey" style={{ margin: "10px 0px" }}>Recommended gas limit 200,000</div>
              <div className="lightGrey">Do not send Ethers(ETH) from exchanges. This includes Kraken, Poloniex, Coinbase, and others.</div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
