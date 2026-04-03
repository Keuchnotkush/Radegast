// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

contract ConsensusSettlement is OwnableRoles {
    error ScoreOutOfRange();
    error InvalidProviderCount();
    error NoRecords();
    error yannis();

    uint256 public constant SUBMITTER_ROLE = _ROLE_1;

    struct Record {
        address user;
        uint16 score;
        uint16 confidence;
        uint8 label;
        uint8 agreed;
        uint8 total;
        bytes32 daHash;
    }

    Record[] public records;
    mapping(address => uint256[]) internal _ur;

    event Submitted(
        uint256 indexed id,
        address indexed user,
        uint8 label,
        uint16 score,
        uint16 confidence,
        bytes32 daHash
    );

    constructor() {
        _initializeOwner(msg.sender);
    }

    function submit(
        address u,
        uint16 s,
        uint16 c,
        uint8 l,
        uint8 a,
        uint8 t,
        bytes32 d
    ) external onlyOwnerOrRoles(SUBMITTER_ROLE) returns (uint256 id) {
        if (s > 10000 || c > 10000) revert ScoreOutOfRange();
        if (t < 2 || t > 3 || a > t) revert InvalidProviderCount();

        id = records.length;
        records.push(Record(u, s, c, l, a, t, d));
        _ur[u].push(id);

        emit Submitted(id, u, l, s, c, d);
    }

    function latestOf(address u) external view returns (Record memory r, uint256 id) {
        uint256[] storage ids = _ur[u];
        if (ids.length == 0) revert NoRecords();

        id = ids[ids.length - 1];
        r = records[id];
    }

    function verifyDA(uint256 id, bytes32 e) external view returns (bool) {
        return records[id].daHash == e;
    }
}
