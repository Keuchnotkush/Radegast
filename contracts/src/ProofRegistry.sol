// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

/// @notice Stores ZK proof attestations on-chain. The proof is generated
///         client-side (Noir/UltraHonk WASM) and the backend submits the
///         attestation after verifying the proof off-chain.
contract ProofRegistry is OwnableRoles {
    error NotFound();

    uint256 public constant SUBMITTER_ROLE = _ROLE_0;

    struct Attestation {
        address user;
        uint64  threshold;
        uint32  verifiedAt;
        bytes32 commitment;
        bytes32 verifyId;
    }

    Attestation[] public attestations;
    mapping(bytes32 => uint256) internal _byId;

    event Verified(uint256 indexed id, address indexed user, uint64 threshold, bytes32 verifyId);

    constructor() { _initializeOwner(msg.sender); }

    function submit(
        address user,
        uint64  threshold,
        bytes32 commitment
    ) external onlyOwnerOrRoles(SUBMITTER_ROLE) returns (uint256 id, bytes32 vid) {
        id = attestations.length;
        vid = keccak256(abi.encodePacked(user, threshold, commitment, id, block.timestamp));
        attestations.push(Attestation(user, threshold, uint32(block.timestamp), commitment, vid));
        _byId[vid] = id + 1;
        emit Verified(id, user, threshold, vid);
    }

    function check(bytes32 vid) external view returns (Attestation memory) {
        uint256 idx = _byId[vid];
        if (idx == 0) revert NotFound();
        return attestations[idx - 1];
    }
}
