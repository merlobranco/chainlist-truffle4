/* pragma solidity ^0.4.18; */
pragma solidity ^0.4.23;

// Importing required contracts
import "./Ownable.sol";

contract ChainList is Ownable { // Extending from Ownable contract
  // Custom types
  struct Article {
    uint id;
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price;
  }

  // State variables
  mapping (uint => Article) public articles;
  uint articleCounter;

  // Events declaration
  event LogSellArticle(
    uint indexed _id,
    address indexed _seller, // The seller argument is indexed, which means that it will be possible to filter events by values of seller address on the client side.
    string _name,
    uint256 _price
  );

  event LogBuyArticle(
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint256 _price
  );

  // Deactivate the contract (Allowing only to the contract owner)
  function kill() public onlyOwner {

    // Passing the address of the owner to refund all the potentially remaining funds in the contract
    selfdestruct(owner);
  }

  // Sell an article
  function sellArticle(string _name, string _description, uint256 _price) public {
    // A new article
    articleCounter++;

    articles[articleCounter] = Article(
      articleCounter,
      msg.sender, // We are not passing the sender because we could stract it from a special object called 'msg'
      0x0,
      _name,
      _description,
      _price
    );

    // Triggering an event
    emit LogSellArticle(articleCounter, msg.sender, _name, _price);
  }

  // Fetch the number of articles in the contract
  function getNumberOfArticles() public view returns (uint) {
    return articleCounter;
  }

  // Fetch and return all article IDs for articles still for sell
  function getArticlesForSale() public view returns (uint[]) {
    // Prepare output array
    uint[] memory articleIds = new uint[](articleCounter); // Its maximum size is articleCounter

    uint numberOfArticlesForSale = 0;
    // Interacting over articles
    for(uint i = 1; i <= articleCounter; i++) {
      // Keeping the ID if the article is still for sale
      if(articles[i].buyer == 0x0) {
        articleIds[numberOfArticlesForSale] = articles[i].id;
        numberOfArticlesForSale++;
      }
    }

    // Copy the articleIds array into a smaller forSale array
    uint[] memory forSale = new uint[](numberOfArticlesForSale);
    for(uint j = 0; j < numberOfArticlesForSale; j++) {
      forSale[j] = articleIds[j];
    }
    return forSale;
  }

  // Buy an article
  function buyArticle(uint _id) payable public { // payable meaning this function may receive value (ether) from its caller
    // Checking if there is an article for sale
    require(articleCounter > 0);

    // Checking if the article exists
    require(_id > 0 && _id <= articleCounter );

    // Retrieving the article
    Article storage article = articles[_id];

    // Checking if the article has not been sold yet
    require(article.buyer == 0x0);

    // Not allowing the seller to buy his own article
    require(msg.sender != article.seller); // Here the msg.sender is the one who is buying the article

    // Checking if the value sent corresponds to the price of the article
    require(msg.value == article.price);

    // Keeping track of buyer's information
    article.buyer = msg.sender;

    // The buyer can pay the seller, so we proceed to transfer the funds on the seller's account
    article.seller.transfer(msg.value);

    // Triggering an event
    emit LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);
  }
}
