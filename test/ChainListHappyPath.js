// Loading the contract to be tested
var ChainList = artifacts.require("./ChainList.sol");

// Test suite definition
contract('ChainList', function(accounts) {
  var chainListInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var articleName1 = "article 1";
  var articleDescription1 = "Description for article 1";
  var articlePrice1 = 10;
  var articleName2 = "article 2";
  var articleDescription2 = "Description for article 2";
  var articlePrice2 = 20;
  var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  // Testing getArticle function
  it("should be initialized with empty values", function() {
    // We use the term of contract's deployed function to get an instance of our deloyed contract asynchronously
    // Once the promise resolves we call the getArticle function on this instance
    // and we return it so we can chain a promise to it
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.getNumberOfArticles();
    // Chaining promises so we are able to test our contract functions
    }).then(function(data) {
      // We use chai assertions to verify that all state variables are properly initialized
      assert.equal(data.toNumber(), 0, "Number of articles must be zero");
      return chainListInstance.getArticlesForSale();
    }).then(function(data) {
      assert.equal(data.length, 0, "There shouldn't be any article for sale");
    })
  });

  // Testing sellArticle function (with a first article)
  it("should let us sell a first article", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.sellArticle(articleName1, articleDescription1, web3.toWei(articlePrice1, "ether"), {from: seller});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogSellArticle", "event should be LogSellArticle");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "event id must be 1");
      assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
      assert.equal(receipt.logs[0].args._name, articleName1, "event first article name must be " + articleName1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice1, "ether"), "event first article price must be " + web3.toWei(articlePrice1, "ether"));

      return chainListInstance.getNumberOfArticles();
    }).then(function(data) {
      // We use chai assertions to verify that all state variables are properly initialized
      assert.equal(data.toNumber(), 1, "Number of articles must be one");
      return chainListInstance.getArticlesForSale();
    }).then(function(data) {
      assert.equal(data.length, 1, "There should be one article for sale");
      assert.equal(data[0].toNumber(), 1, "article id must be 1");

      // Getting the first article thought the public getter generated by the compiler
      return chainListInstance.articles(data[0]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "article id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], articleName1, "first article name must be " + articleName1);
      assert.equal(data[4], articleDescription1, "first article description must be " + articleDescription1);
      // Remember transforming articlePrice with web3.toWei(articlePrice1, "ether"). In other case the assertion, so the test, will fail
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice1, "ether"), "first article price should be " + web3.toWei(articlePrice1, "ether"));
    })
  });

  // Testing sellArticle function (with a second article)
  it("should let us sell a second article", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.sellArticle(articleName2, articleDescription2, web3.toWei(articlePrice2, "ether"), {from: seller});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogSellArticle", "event should be LogSellArticle");
      assert.equal(receipt.logs[0].args._id.toNumber(), 2, "event id must be 2");
      assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
      assert.equal(receipt.logs[0].args._name, articleName2, "event first article name must be " + articleName2);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice2, "ether"), "event first article price must be " + web3.toWei(articlePrice2, "ether"));

      return chainListInstance.getNumberOfArticles();
    }).then(function(data) {
      // We use chai assertions to verify that all state variables are properly initialized
      assert.equal(data.toNumber(), 2, "Number of articles must be two");
      return chainListInstance.getArticlesForSale();
    }).then(function(data) {
      assert.equal(data.length, 2, "There should be two articles for sale");
      assert.equal(data[1].toNumber(), 2, "article id must be 2");

      // Getting the second article thought the public getter generated by the compiler
      return chainListInstance.articles(data[1]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 2, "article id must be 2");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], articleName2, "second article name must be " + articleName2);
      assert.equal(data[4], articleDescription2, "second article description must be " + articleDescription2);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice2, "ether"), "second article price should be " + web3.toWei(articlePrice2, "ether"));
    })
  });

  // Testing buyArticle function (with the first article)
  // This test should be run after testing the unless once sellArticle function because in other way won't be an article available for buying
  it("should buy an article", function() {
    return ChainList.deployed().then(function(instance) {
      // Recording balances of seller and buyer before the buy
      sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceBeforeBuy = web3.toWei(web3.eth.getBalance(buyer), "ether").toNumber();

      chainListInstance = instance;
      return chainListInstance.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice1, "ether")});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogBuyArticle", "event should be LogBuyArticle");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "event id must be 1");
      assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
      assert.equal(receipt.logs[0].args._buyer, buyer, "event buyer must be " + buyer);
      assert.equal(receipt.logs[0].args._name, articleName1, "event article name must be " + articleName1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice1, "ether"), "event article price must be " + web3.toWei(articlePrice1, "ether"));

      // Recording balances of seller and buyer after the buy
      sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();

      // Checking the effect of buy on balances of buyer and seller, accounting for gas
      assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + articlePrice1, "seller should have earned " + articlePrice1 + " ETH");
      // Keeping in mind that the buyer spend some gas for buying the article
      assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice1, "buyer should have spent " + articlePrice1 + " ETH");

      return chainListInstance.getArticlesForSale();
    }).then(function(data) {
      assert.equal(data.length, 1, "There should be now only 1 article left for sale");
      assert.equal(data[0].toNumber(), 2, "article 2 should be the only article left for sale");
      return chainListInstance.getNumberOfArticles();
    }).then(function(data){
      assert.equal(data.toNumber(), 2, "Still there should be 2 articles in total");
    })
  });
});
