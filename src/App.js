import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { Tabs, Tab, Col, Toast, Button } from 'react-bootstrap';

import './components/app.css';
import './extra/css/style.css'
import Navigate from './components/Navigate'
import AddItems from './components/AddItems';
import Cards from './components/Cards';

import stokedAbi from './contracts/stoked.abi.json';
import stokeTokenAbi from './contracts/stoke.abi.json';
import Group from './components/Group';
import PrevWin from './components/PrevWin';
import Footer from './components/Footer';

const MY_ERC20_DECIMALS = 10; // I will be using 10 instead of 18 
const stokeTokenAddress = "0x9C002b1C1E0e5A9D0cD4787AeE4e01f28a46aaa7"
const StokedContractAddress = "0x5F528C36e47ECDfc4560121AF7Dd9428C4840BB3"

const cost = 2; // this is the cost to donate

function App() {

  // use useReducer to make this look cleaner later
  // load web3 and contract
  const [kit, setKit] = useState(null);
  const [address, setAddress] = useState('0x0')
  const [contract, setContract] = useState(null)
  const [balance, setBalance] = useState(0);
  // get data from blockchain
  const [everyAnime, setEveryAnime] = useState([]);
  const [currentGrp, setCurrentGrp] = useState([]);
  const [reigningGrp, setReigningGrp] = useState([]); // change to null
  const [reigningWinner, setReigningWinner] = useState('');
  const [totalVoteCount, setTotalVoteCount] = useState(0);
  const [winningName, setWinningName] = useState('');
  // control the UI
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState('allPicks');
  const [toaster, setToaster] = useState({
    show: false,
    status: '',
    detail: ""
  });

  

  useEffect(() => {
    loadWeb3()
  }, [address])
  
  useEffect(() => {
    if (!kit) return ; // useeffect run first before checking dependecy, this ensure that it doesn't run before
    loadBlockchain()
  }, [kit])

  useEffect(() => {
    if (!kit) return ;
    getAllAnime()
  }, [contract])

  useEffect(() => {
    if (!kit) return ;
    getCurrentGroup()
  }, [contract])

  useEffect(() => {
    if (!kit) return ;
    getReigningGroup()
  }, [contract])

  useEffect(() => {
    if (!kit) return;
    getTheWinner()
  }, [contract])

  function loader() {
    return (
      <div className="loader"></div>
    )
  }

  async function getBalance() {
    if (!kit) return;
    const ethBalance = await kit.eth.getBalance(address);
    const etherBalance = await new BigNumber(ethBalance).shiftedBy(-18).toString(); 
    setBalance(etherBalance);
  }

  async function donateToLike(animeName) {
    setLoading(true);

    const amount = new BigNumber(cost).shiftedBy(MY_ERC20_DECIMALS).toString();

    const stokeTokenContract = await new kit.eth.Contract(stokeTokenAbi, stokeTokenAddress)

    await stokeTokenContract.methods.approve(StokedContractAddress, amount)
      .send({ from: address })
      .on('transactionHash', hash => {
        // voting transaction goes here
        contract.methods.voting(animeName)
          .send({ from: address })
          .on('transactionHash', hash => {
            contract.methods.isThereWinner().call()
              .then(res => {
                console.log("isThereWinner", res);
                // res should  be true or false
                if (res) {
                  contract.methods.winningAnimeName().call()
                    .then(res => {setWinningName(res)})
                    .catch(err => console.error(err))
                  // begin winning voters selection process
                  // contract.methods.winningVoter().call()
                }
              })
              .catch(err => console.error(err))
            // What you want it to do after voting
            setLoading(false);
          }).catch(error => {
            setToaster({
              ...toaster,
              show: true,
              status: 'error',
              detail: error.message.length > 500 ? "You can't vote more than five times" : error.message
            })
            setLoading(false);

          })

      }).catch(error => {
        setToaster({
          ...toaster,
          show: true,
          status: 'error',
          detail: error.message
        })
        setLoading(false);

      })

  }

  async function createAnimeList(arr = [[]]) {
    try {
      setLoading(true);
      let createListReply = await contract.methods
      .createAnimeList(arr)
      .send({from: address});

      setToaster({
        ...toaster,
        show: true,
        status: 'success',
        detail: "Creation was successful"
      })

      setLoading(false);
      
    } catch (error) {
      console.error("create list error", error)
      setToaster({ ...toaster,
        show: true,
        status: 'error',
        detail: error.message
      })
      setLoading(false);
    }

  }

  function getCurrentGroup() {
    contract.methods.getCurrentGroup().call()
      .then((res) => setCurrentGrp(res))
    
    contract.methods.totalVoteCount().call()
      .then((res) => setTotalVoteCount(res))
    
  }

  function getReigningGroup() {
    // let winNum;
    // await contract.methods.previousWinnerNum().call()
    //   .then(res => winNum = res)


    contract.methods.previousWinner().call()
      .then(res => setReigningWinner(res))

    contract.methods.previousAnimesGrp_().call()
      .then(res => setReigningGrp(res))

  }

  function getTheWinner() {
    contract.methods.isThereWinner().call()
      .then(res => {
        // res should  be true or false
        if (res) {
          contract.methods.winningAnimeName().call()
            .then(res => { setWinningName(res); console.log('winningAnime', res) })
            .catch(err => console.error(err))
          // begin winning voters selection process
          // contract.methods.winningVoter().call()
        }
      })
      .catch(err => console.error(err))

  }

  function payWinner() {
    contract.methods.winningVoter()
      .send({ from: address })
      .on("transactionHash", hash => {
        console.log("All winning address has been selected");
        contract.methods.payWinner()
          .send({ from: address })
          .on("transactionHash", hash => {
            console.log("Payment was successful");
            contract.methods.previousWinner().call()
              .then(res => setReigningWinner(res))
            // console.log(reigningWinner);
            
            contract.methods.previousAnimesGrp_().call()
              .then(res => setReigningGrp(res))
            // console.log(reigningGrp);

          }).catch(error => {
            setToaster({
              ...toaster,
              show: true,
              status: 'error',
              detail: error.message.length > 360 ? "You are not authorized to pay out" : error.message
            })
            setLoading(false);

          })

      }).catch(error => {
        setToaster({
          ...toaster,
          show: true,
          status: 'error',
          detail: error.message
        })
        setLoading(false);

      })
  }

  // function getAnimeByNum(num) {
  //   let yoo = contract.methods.animes_(num).call()
  //   // it's a promise
  //   console.log(yoo);
  // }
  
  // function getAnimeByName(str) {
  //   let yoo = contract.methods.readAnimeByName(str).call()
  //   // it's a promise
  //   console.log(yoo);
  // }


  
  async function getAllAnime() {
    let allAnime = await contract.methods.readAllAnime().call()
    // console.log('allAnime', allAnime);
    setEveryAnime(allAnime);
  }

  async function loadWeb3() {
    if (window.ethereum) {
      try {
        // enable celo interaction
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.send('eth_requestAccounts');
        // let celoKit = newKitFromWeb3(window.web3);
        await setKit(window.web3);
        await getBalance()

      }
      catch (error) {
        console.error(error);
      }
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
      window.web3.eth.net.getId()
        .then(async (res) => {
          if (res == 44787) {
            // window.ethereum.send('eth_requestAccounts');
            console.log('Hello currentProvider');
            // let celoKit = newKitFromWeb3(window.web3);
            await setKit(window.web3);
            await getBalance()
            
          } else {
            alert("You need to switch to Rinkeby network on metamask")
          }
        }).catch(error => console.error(error))
      // alert("You should access this with celo-browser extension")
    } else {
      alert("Get the Metamask extension from chrome extensions")
    }
  }

  async function loadBlockchain() {
    const web3 = window.web3;
    let address_ = await web3.eth.getAccounts();

    // get and set default address
    //kit.defaultAccount = address_[0];
    await setAddress(address_[0]);


    // sign and set contract
    const myContract = new web3.eth.Contract(stokedAbi, StokedContractAddress);
    await setContract(myContract);

  }

  return (
    <div className="App">
      <Navigate account={[address, balance]} />

      {loading ? loader() : ""}

      <>
        <Col xs={6}>
          <Toast className="toaster" onClose={() => setToaster({...toaster, show: false})} show={toaster.show} delay={25000} autohide>
            <Toast.Header>
              <strong className={`me-auto ${toaster.status === "success" ? "text-success" : "text-danger"}`}>
                {toaster.status === "success" ? '✔' : "⚠"} {toaster.status.toUpperCase()} !
              </strong>
            </Toast.Header>
            <Toast.Body>
              {toaster.detail} 
            </Toast.Body>
          </Toast>
        </Col>
      </>

      <AddItems createAnimeList={createAnimeList} />

      {/* <Button onClick={() => setToaster({...toaster, show: false })} className="btn btn-primary btn-lg">Get group</Button> */}

      <Group currentGrp={currentGrp} donateToLike={donateToLike} winningName={winningName} totalVoteCount={totalVoteCount} payWinner={payWinner} />

      <Tabs
        id="controlled-tab-example"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3 tabs_"
      >
        <Tab eventKey="allPicks" title="All Picks">
          <Cards everyAnime={everyAnime} />
        </Tab>
        <Tab eventKey="prevWin" title="Previous Winner">
          <PrevWin reigningWinner={reigningWinner} reigningGrp={reigningGrp} />
        </Tab>
      </Tabs>

      <Footer />

    </div>
  );
}

export default App;
