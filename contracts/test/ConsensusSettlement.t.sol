// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ConsensusSettlement.sol";

contract ConsensusSettlementTest is Test {
    ConsensusSettlement cs;
    address owner = address(this);
    address submitter = makeAddr("submitter");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    bytes32 constant DA_HASH = keccak256("test-da");

    function setUp() public {
        cs = new ConsensusSettlement();
        cs.grantRoles(submitter, cs.SUBMITTER_ROLE());
    }

    // ── submit ──

    function test_submit() public {
        vm.prank(submitter);
        uint256 id = cs.submit(alice, 8500, 9200, 1, 2, 3, DA_HASH);
        assertEq(id, 0);

        (
            address user,
            uint16 score,
            uint16 confidence,
            uint8 label,
            uint8 agreed,
            uint8 total,
            bytes32 daHash
        ) = cs.records(0);

        assertEq(user, alice);
        assertEq(score, 8500);
        assertEq(confidence, 9200);
        assertEq(label, 1);
        assertEq(agreed, 2);
        assertEq(total, 3);
        assertEq(daHash, DA_HASH);
    }

    function test_submit_emitsEvent() public {
        vm.prank(submitter);
        vm.expectEmit(true, true, false, true);
        emit ConsensusSettlement.Submitted(0, alice, 1, 8500, 9200, DA_HASH);
        cs.submit(alice, 8500, 9200, 1, 2, 3, DA_HASH);
    }

    function test_submit_ownerCanSubmit() public {
        uint256 id = cs.submit(alice, 5000, 5000, 0, 2, 2, DA_HASH);
        assertEq(id, 0);
    }

    function test_submit_revertsUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert();
        cs.submit(alice, 5000, 5000, 0, 2, 2, DA_HASH);
    }

    function test_submit_revertsScoreOutOfRange() public {
        vm.prank(submitter);
        vm.expectRevert(ConsensusSettlement.ScoreOutOfRange.selector);
        cs.submit(alice, 10001, 5000, 0, 2, 2, DA_HASH);
    }

    function test_submit_revertsConfidenceOutOfRange() public {
        vm.prank(submitter);
        vm.expectRevert(ConsensusSettlement.ScoreOutOfRange.selector);
        cs.submit(alice, 5000, 10001, 0, 2, 2, DA_HASH);
    }

    function test_submit_revertsTotalTooLow() public {
        vm.prank(submitter);
        vm.expectRevert(ConsensusSettlement.InvalidProviderCount.selector);
        cs.submit(alice, 5000, 5000, 0, 1, 1, DA_HASH);
    }

    function test_submit_revertsTotalTooHigh() public {
        vm.prank(submitter);
        vm.expectRevert(ConsensusSettlement.InvalidProviderCount.selector);
        cs.submit(alice, 5000, 5000, 0, 2, 4, DA_HASH);
    }

    function test_submit_revertsAgreedExceedsTotal() public {
        vm.prank(submitter);
        vm.expectRevert(ConsensusSettlement.InvalidProviderCount.selector);
        cs.submit(alice, 5000, 5000, 0, 3, 2, DA_HASH);
    }

    // ── latestOf ──

    function test_latestOf() public {
        vm.startPrank(submitter);
        cs.submit(alice, 1000, 1000, 0, 2, 2, DA_HASH);
        cs.submit(alice, 2000, 2000, 1, 3, 3, DA_HASH);
        vm.stopPrank();

        (ConsensusSettlement.Record memory r, uint256 id) = cs.latestOf(alice);
        assertEq(id, 1);
        assertEq(r.score, 2000);
    }

    function test_latestOf_revertsNoRecords() public {
        vm.expectRevert(ConsensusSettlement.NoRecords.selector);
        cs.latestOf(bob);
    }

    // ── verifyDA ──

    function test_verifyDA_true() public {
        vm.prank(submitter);
        cs.submit(alice, 5000, 5000, 0, 2, 2, DA_HASH);
        assertTrue(cs.verifyDA(0, DA_HASH));
    }

    function test_verifyDA_false() public {
        vm.prank(submitter);
        cs.submit(alice, 5000, 5000, 0, 2, 2, DA_HASH);
        assertFalse(cs.verifyDA(0, keccak256("wrong")));
    }
}
