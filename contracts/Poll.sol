pragma solidity 0.4.25;

contract Poll {
    // Model a Entity
    struct Entity {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store Entities
    // Fetch Entity
    mapping(uint256 => Entity) public Entities;
    // Store Entities Count
    uint256 public EntitiesCount;

    // voted event
    event votedEvent(uint256 indexed _EntityId);

    constructor() public {
        addEntity("JavaScript");
        addEntity("Java");
        addEntity("Python");
    }

    function addEntity(string _name) private {
        EntitiesCount++;
        Entities[EntitiesCount] = Entity(EntitiesCount, _name, 0);
    }

    function vote(uint256 _EntityId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid Entity
        require(_EntityId > 0 && _EntityId <= EntitiesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update Entity vote Count
        Entities[_EntityId].voteCount++;

        // trigger voted event
        emit votedEvent(_EntityId);
    }
}
