App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  totalVotes:0,
  list:{},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("poll.json", function(poll) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.poll = TruffleContract(poll);
      // Connect provider to interact with contract
      App.contracts.poll.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.poll.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var pollInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.poll.deployed().then(function(instance) {
      pollInstance = instance;
      return pollInstance.EntitiesCount();
    }).then(function(EntitiesCount) {
      var EntitiesResults = $("#EntitiesResults");
      EntitiesResults.empty();

      var EntitiesSelect = $('#EntitiesSelect');
      EntitiesSelect.empty();
      for (var i = 1; i <= EntitiesCount; i++) {
        pollInstance.Entities(i).then(function(Entity) {
          var name = Entity[1];
          var voteCount = Entity[2]['c'];
          if(!App.list[name]){
          App.list[name] = Entity;
          App.totalVotes = App.totalVotes + voteCount[0];
          }
        });

      }
      for (var i = 1; i <= EntitiesCount; i++) {
        pollInstance.Entities(i).then(function(Entity) {
          var id = Entity[0];
          var name = Entity[1];
          var voteCount = Entity[2]['c'][0];
          var percentage = (voteCount/App.totalVotes)*100;
          // Render Entity Result
          var EntityTemplate = "<tr><th>" + name + "</th><td><div class='progress'><div class='progress-bar progress-bar-success' role='progressbar'"
            +" aria-valuenow='"+percentage+"' aria-valuemin='' aria-valuemax='100' style='width:"+percentage+"%'>"
            + percentage+"%</div></div></td></tr>";
          EntitiesResults.append(EntityTemplate);

          // Render Entity ballot option
          var EntityOption = "<div  class='radio'><label><input type='radio' name='selectedProgram'  value='" + id + "' >" + name + "</label></div>"
          EntitiesSelect.append(EntityOption);
          
        });
      }
      return pollInstance.voters(App.account);
    }).then(function(hasVoted) {
      loader.hide();
      content.show();
      // Do not allow a user to vote
      if(hasVoted) {
        $('#polling').hide();
      }
      else{
        $('#results').hide();
      }
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var EntityId = $('input[name="selectedProgram"]:checked').val();
    EntityId = +EntityId;
    App.contracts.poll.deployed().then(function(instance) {
      return instance.vote(EntityId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
      location.reload();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
