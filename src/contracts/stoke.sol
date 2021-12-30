// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts@4.4.1/token/ERC20/ERC20.sol";

contract Stoke is ERC20 {
    constructor() ERC20("Stoke", "STK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
