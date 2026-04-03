// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "solady/tokens/ERC20.sol";
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

contract XStockMock is ERC20, OwnableRoles {
    error PriceZero();

    uint256 public constant MINTER_ROLE = _ROLE_0;

    string internal _name;
    string internal _symbol;
    uint192 public price;
    uint64 public priceUpdatedAt;

    constructor(string memory n, string memory s, uint192 p) {
        if (p == 0) revert PriceZero();
        _name = n;
        _symbol = s;
        price = p;
        priceUpdatedAt = uint64(block.timestamp);
        _initializeOwner(msg.sender);
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function mint(address to, uint256 a) external onlyRoles(MINTER_ROLE) {
        _mint(to, a);
    }

    function burn(address f, uint256 a) external onlyRoles(MINTER_ROLE) {
        _burn(f, a);
    }

    function setPrice(uint192 p) external onlyOwner {
        if (p == 0) revert PriceZero();
        price = p;
        priceUpdatedAt = uint64(block.timestamp);
    }

    function valueOf(address a) external view returns (uint256) {
        return (balanceOf(a) * uint256(price)) / 1e18;
    }
}
