App = {
     web3Provider: null,
     contracts: {},
     account: 0x0,
     loading: false, // Required for avoiding the calling several times the reloadArticles function

     init: function() {
        return App.initWeb3();
     },

     initWeb3: function() {
        // Initialize web3
        if(typeof web3 != 'undefined') {
          // Reuse the provider of the web3 object injected by Metamask
          App.web3Provider = web3.currentProvider;
          // This line is required because Metamask stop exposing user accounts to DApps from 02/11/2018
          App.web3Provider.enable();
        } else {
          // Create a new provider and plug it directly into our local node. Ganache credentials
          App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        web3 = new Web3(App.web3Provider);

        App.displayAccountInfo();

        return App.initContract();
     },

     displayAccountInfo: function() {
        // We call the getCoinbase function to retrieve the information about the current account selected by web3
        // and this function is asynchronous and returns the account in the callback function.
        web3.eth.getCoinbase(function(err, account) { // Callback function
          if (err == null) {
            // We store it in App
            App.account = account;
            // And we display it in the HTML page
            $('#account').text(account);
            web3.eth.getBalance(account, function(err, balance) { // account and Callback function
              if(err == null) {
                $('#accountBalance').text(web3.fromWei(balance, "ether") + "ETH");
              }
            })
          }
        });
     },

     initContract: function() {
       $.getJSON('ChainList.json', function(chainListArtifact) {// Callback function
         // Get the contract artifact file and use it to instantiate a truffle contract abstraction
         App.contracts.ChainList = TruffleContract(chainListArtifact);
         // Set the provider for our contracts
         App.contracts.ChainList.setProvider(App.web3Provider);
         // Listen to events
         App.listenToEvents();
         // Retrieve the article from the contract
         return App.reloadArticles();
       });
     },

     reloadArticles: function() {
       // Avoiding reentry
       if(App.loading) {
         return;
       }
       App.loading = true;

       // Refresh account information because the balance might have changed
       App.displayAccountInfo();

       var chainListInstance;

       App.contracts.ChainList.deployed().then(function(instance) {
         chainListInstance = instance;
         return chainListInstance.getArticlesForSale();
       }).then(function(articleIds) {
         // Retrieve the article placeholder and clear it
         $('#articlesRow').empty();

         for(var i = 0; i < articleIds.length; i++) {
           var articleId = articleIds[i];
           chainListInstance.articles(articleId.toNumber()).then(function(article) {
             App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
           });
         }

         App.loading = false;
       }).catch(function(err) {
         console.error(err.message);
         App.loading = false;
       });
     },

     displayArticle: function(id, seller, name, description, price) {
       var articlesRow = $('#articlesRow');

       // Extracting the price of the article
       var etherPrice = web3.fromWei(price, "ether");

       // Retrieve the article template and fill it
       var articleTemplate = $('#articleTemplate');
       articleTemplate.find('.panel-title').text(name);
       articleTemplate.find('.article-description').text(description);
       articleTemplate.find('.article-price').text(etherPrice + "ETH");
       // Keeping track of the id and price of the article in the 'data' field of the 'btn-buy' button
       articleTemplate.find('.btn-buy').attr('data-id', id);
       articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

       // Seller
       if (seller == App.account) {
         articleTemplate.find('.article-seller').text("You");
         articleTemplate.find('.btn-buy').hide();
       } else {
         articleTemplate.find('.article-seller').text(seller);
         articleTemplate.find('.btn-buy').show();
       }

       // Adding this new article to articlesRow
       $('#articlesRow').append(articleTemplate.html());
     },

     sellArticle: function() {
       // Retrieve the detail of the article
       var _article_name = $('#article_name').val();
       var _description = $('#article_description').val();
       var _price = web3.toWei(parseFloat($('#article_price').val() || 0), "ether");

       // Nothing to sell
       if (_article_name.trim() == '' || _price == 0) {
         return false;
       }

       App.contracts.ChainList.deployed().then(function(instance) {
         return instance.sellArticle(_article_name, _description, _price, {
           from: App.account,
           gas: 500000
         });
       }).catch(function(err) {
         console.error(err.message);
       });
     },

     // Listen to events triggered by the contract
     listenToEvents: function() {
       App.contracts.ChainList.deployed().then(function(instance) {
          instance.LogSellArticle({},{}).watch(function(error, event) {
            if (!error) {
              $("#events").append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>');
            } else {
              console.error(error);
            }
            // We reload again all the articles
            // Updating the content with the interface (no need for reloading manually the webpage any more)
            App.reloadArticles();
          });

          instance.LogBuyArticle({},{}).watch(function(error, event) {
            if (!error) {
              $("#events").append('<li class="list-group-item">' + event.args._buyer + ' has bought ' + event.args._name + '</li>');
            } else {
              console.error(error.message);
            }
            // We reload again all the articles
            // Updating the content with the interface (no need for reloading manually the webpage any more)
            App.reloadArticles();
          });
       });
     },

     buyArticle: function() {
       event.preventDefault();

       // Retrieve the article id and price from the 'data' field of the 'btn-buy' button
       // event.target allows us to get the data from de button that was clic
       var _articleId = $(event.target).data('id');
       var _price = web3.toWei(parseFloat($(event.target).data('value') || 0), "ether");

       App.contracts.ChainList.deployed().then(function(instance) {
         return instance.buyArticle(_articleId, {
           from: App.account,
           value: _price,
           gas: 500000
         });
       }).catch(function(err){
         console.error(err.message);
       });
     },
};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
