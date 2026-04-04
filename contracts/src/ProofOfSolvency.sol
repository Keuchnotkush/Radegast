// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

contract ProofOfSolvency is OwnableRoles {
    error InvalidProof();
    error NotFound();
    error VerifierNotSet();

    struct Attestation {
        address user;
        uint64 threshold;
        uint32 verifiedAt;
        bytes32 commitment;
        bytes32 verifyId;
    }

    address public verifier;
    Attestation[] public attestations;
    mapping(bytes32 => uint256) internal _bv;

    event Verified(uint256 indexed id, address indexed user, uint64 threshold, bytes32 verifyId);

    constructor(address v) {
        _initializeOwner(msg.sender);
        verifier = v;
    }

    function setVerifier(address v) external onlyOwner {
        verifier = v;
    }

    function verify(bytes calldata proof, bytes32[] calldata pub) external returns (uint256 id, bytes32 vid) {
        if (verifier == address(0)) revert VerifierNotSet();

        (bool ok_, bytes memory ret) = verifier.staticcall(
            abi.encodeWithSignature("verify(bytes,bytes32[])", proof, pub)
        );
        if (!ok_ || ret.length != 32 || !abi.decode(ret, (bool))) revert InvalidProof();

        uint64 t = uint64(uint256(pub[0]));
        bytes32 c = pub[1];

        id = attestations.length;
        vid = keccak256(abi.encodePacked(msg.sender, t, c, id));
        attestations.push(Attestation(msg.sender, t, uint32(block.timestamp), c, vid));
        _bv[vid] = id + 1;

        emit Verified(id, msg.sender, t, vid);
    }

    function check(bytes32 vid) external view returns (Attestation memory) {
        uint256 idx = _bv[vid];
        if (idx == 0) revert NotFound();
        return attestations[idx - 1];
    }
}
