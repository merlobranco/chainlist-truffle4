pragma solidity ^0.4.23;

contract Ownable {
   // State variables
   address owner;

   // Modifiers
   modifier onlyOwner() {
     require(msg.sender == owner);
     _;
   }

   // Constructor
   constructor() public {
     owner = msg.sender;
   }
}
