// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "solady/tokens/ERC20.sol";
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

/// @title MockUSDC — Testnet stablecoin for Radegast demo
/// @notice 6 decimals like real USDC. MINTER_ROLE can mint/burn freely.
contract MockUSDC is ERC20, OwnableRoles {
    uint256 public constant MINTER_ROLE = _ROLE_0;

    function name() public pure override returns (string memory) {
        return "USD Coin";
    }

    function symbol() public pure override returns (string memory) {
        return "USDC";
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    constructor() {
        _initializeOwner(msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRoles(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRoles(MINTER_ROLE) {
        _burn(from, amount);
    }
}
