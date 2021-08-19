// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20Token is ERC20 {
    constructor() ERC20("<YOUR_TOKEN_NAME>", "<YOUR_TOKEN_SYMBOL>") {
        _mint(msg.sender, 100000000000000000000);
    }
}