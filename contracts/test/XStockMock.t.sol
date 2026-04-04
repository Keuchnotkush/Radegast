// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/XStockMock.sol";

contract XStockMockTest is Test {
    XStockMock token;
    address owner = address(this);
    address minter = makeAddr("minter");
    address alice = makeAddr("alice");

    function setUp() public {
        token = new XStockMock("Tesla xStock", "TSLAx", 250e6);
        token.grantRoles(minter, token.MINTER_ROLE());
    }

    // ── constructor ──

    function test_constructor_setsFields() public view {
        assertEq(token.name(), "Tesla xStock");
        assertEq(token.symbol(), "TSLAx");
        assertEq(token.price(), 250e6);
        assertGt(token.priceUpdatedAt(), 0);
        assertEq(token.owner(), owner);
    }

    function test_constructor_revertsOnZeroPrice() public {
        vm.expectRevert(XStockMock.PriceZero.selector);
        new XStockMock("X", "X", 0);
    }

    // ── mint / burn ──

    function test_mint() public {
        vm.prank(minter);
        token.mint(alice, 1e18);
        assertEq(token.balanceOf(alice), 1e18);
    }

    function test_mint_revertsWithoutRole() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1e18);
    }

    function test_burn() public {
        vm.prank(minter);
        token.mint(alice, 5e18);

        vm.prank(minter);
        token.burn(alice, 2e18);
        assertEq(token.balanceOf(alice), 3e18);
    }

    function test_burn_revertsWithoutRole() public {
        vm.prank(alice);
        vm.expectRevert();
        token.burn(alice, 1e18);
    }

    // ── setPrice ──

    function test_setPrice() public {
        token.setPrice(500e6);
        assertEq(token.price(), 500e6);
        assertEq(token.priceUpdatedAt(), uint64(block.timestamp));
    }

    function test_setPrice_revertsOnZero() public {
        vm.expectRevert(XStockMock.PriceZero.selector);
        token.setPrice(0);
    }

    function test_setPrice_revertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        token.setPrice(100e6);
    }

    // ── valueOf ──

    function test_valueOf() public {
        vm.prank(minter);
        token.mint(alice, 2e18);
        // 2e18 * 250e6 / 1e18 = 500e6
        assertEq(token.valueOf(alice), 500e6);
    }

    function test_valueOf_zeroBalance() public view {
        assertEq(token.valueOf(alice), 0);
    }
}
