// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ProofOfSolvency.sol";

/// @dev Minimal mock that always returns true
contract MockVerifierOk {
    function verify(bytes calldata, bytes32[] calldata) external pure returns (bool) {
        return true;
    }
}

/// @dev Mock that always returns false
contract MockVerifierFail {
    function verify(bytes calldata, bytes32[] calldata) external pure returns (bool) {
        return false;
    }
}

/// @dev Mock that reverts
contract MockVerifierRevert {
    function verify(bytes calldata, bytes32[] calldata) external pure {
        revert("boom");
    }
}

contract ProofOfSolvencyTest is Test {
    ProofOfSolvency pos;
    MockVerifierOk verifierOk;
    MockVerifierFail verifierFail;
    MockVerifierRevert verifierRevert;

    address owner = address(this);
    address alice = makeAddr("alice");

    bytes constant DUMMY_PROOF = hex"1234";
    uint64 constant THRESHOLD = 1000;
    bytes32 constant COMMITMENT = keccak256("commitment");

    function _pub() internal pure returns (bytes32[] memory p) {
        p = new bytes32[](2);
        p[0] = bytes32(uint256(THRESHOLD));
        p[1] = COMMITMENT;
    }

    function setUp() public {
        verifierOk = new MockVerifierOk();
        verifierFail = new MockVerifierFail();
        verifierRevert = new MockVerifierRevert();
        pos = new ProofOfSolvency(address(verifierOk));
    }

    // ── constructor ──

    function test_constructor() public view {
        assertEq(pos.owner(), owner);
        assertEq(pos.verifier(), address(verifierOk));
    }

    // ── setVerifier ──

    function test_setVerifier() public {
        pos.setVerifier(address(verifierFail));
        assertEq(pos.verifier(), address(verifierFail));
    }

    function test_setVerifier_revertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        pos.setVerifier(address(0));
    }

    // ── verify ──

    function test_verify() public {
        vm.prank(alice);
        (uint256 id, bytes32 vid) = pos.verify(DUMMY_PROOF, _pub());

        assertEq(id, 0);
        assertTrue(vid != bytes32(0));

        (
            address user,
            uint64 threshold,
            uint32 verifiedAt,
            bytes32 commitment,
            bytes32 verifyId
        ) = pos.attestations(0);

        assertEq(user, alice);
        assertEq(threshold, THRESHOLD);
        assertEq(verifiedAt, uint32(block.timestamp));
        assertEq(commitment, COMMITMENT);
        assertEq(verifyId, vid);
    }

    function test_verify_emitsEvent() public {
        bytes32 expectedVid = keccak256(
            abi.encodePacked(alice, THRESHOLD, COMMITMENT, block.number)
        );

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit ProofOfSolvency.Verified(0, alice, THRESHOLD, expectedVid);
        pos.verify(DUMMY_PROOF, _pub());
    }

    function test_verify_revertsVerifierNotSet() public {
        pos.setVerifier(address(0));

        vm.prank(alice);
        vm.expectRevert(ProofOfSolvency.VerifierNotSet.selector);
        pos.verify(DUMMY_PROOF, _pub());
    }

    function test_verify_revertsOnFalse() public {
        pos.setVerifier(address(verifierFail));

        vm.prank(alice);
        vm.expectRevert(ProofOfSolvency.InvalidProof.selector);
        pos.verify(DUMMY_PROOF, _pub());
    }

    function test_verify_revertsOnRevert() public {
        pos.setVerifier(address(verifierRevert));

        vm.prank(alice);
        vm.expectRevert(ProofOfSolvency.InvalidProof.selector);
        pos.verify(DUMMY_PROOF, _pub());
    }

    // ── check ──

    function test_check() public {
        vm.prank(alice);
        (, bytes32 vid) = pos.verify(DUMMY_PROOF, _pub());

        ProofOfSolvency.Attestation memory a = pos.check(vid);
        assertEq(a.user, alice);
        assertEq(a.threshold, THRESHOLD);
        assertEq(a.verifyId, vid);
    }

    function test_check_revertsNotFound() public {
        vm.expectRevert(ProofOfSolvency.NotFound.selector);
        pos.check(keccak256("nonexistent"));
    }
}
