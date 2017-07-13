import Web3 from 'web3'
import sweetAlert from 'sweetalert';
import 'sweetalert/dist/sweetalert.css';
import gif from '../gif_metamask.gif';


let getWeb3 = new Promise(function (resolve, reject) {
  // Wait for loading completion to avoid race conditions with web3 injection timing.
  window.addEventListener('load', function () {
    var results
    var web3 = window.web3;
    var netId

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider.
      web3 = new Web3(web3.currentProvider)

      web3.version.getNetwork((err, netId) => {
        let netIdName;
        switch (netId) {
          case "1":
            netIdName = 'mainnet'
            console.log('This is mainnet')
            break
          case "2":
            netIdName = 'morden'
            console.log('This is the deprecated Morden test network.')
            break
          case "3":
            netIdName = 'ropsten'
            console.log('This is the ropsten test network.')
            break
          case "42":
            netIdName = 'kovan'
            console.log('This is kovan')
            break
          default:
            console.log('This is an unknown network.')
        }
        resolve({
          web3,
          netIdName,
          injectedWeb3: true
        });
      })
      console.log('Injected web3 detected.');

    } else {
      // Fallback to localhost if no web3 injection.
      const MAINET_RPC_URL = 'https://mainnet.infura.io/metamask'
      const ROPSTEN_RPC_URL = 'https://ropsten.infura.io/metamask'
      const KOVAN_RPC_URL = 'https://kovan.infura.io/metamask'
      const RINKEBY_RPC_URL = 'https://rinkeby.infura.io/metamask'

      var provider = new Web3.providers.HttpProvider(ROPSTEN_RPC_URL)

      web3 = new Web3(provider)
      results = {
        web3: web3,
        netIdName: 'ropsten',
      }

      console.log('No web3 instance injected, using Local web3.');

      resolve(results)
    }
  })
})

export default getWeb3
