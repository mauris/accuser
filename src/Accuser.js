/*
  Accuser - Github wrapper for pull request automation..
 */

var GitHubApi = require("github");
var Promise = require('bluebird');

var Accuser = function (options) {
  options = options || {};
  this.workers = [];
  this.repos = [];
  this.interval = options.interval || 300000;
  options.Promise = Promise;
  this.github = new GitHubApi(options);
};

Accuser.prototype.authenticate = function(config) {
  return this.github.authenticate(config);
};

Accuser.prototype.watch = function(user, repository) {
  var self = this;
  this.repos.push([user, repository]);
  return self;
}

Accuser.prototype.accuse = function(pr, usernames) {
  var self = this;
  console.log({
    user: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
    number: pr.number,
    assignees: usernames
  });
  self.github.issues.addAssigneesToIssue({
    user: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
    number: pr.number,
    assignees: usernames
  });
};

Accuser.prototype.addWorker = function() {
  var self = this;
  var worker = {
    'filters': [],
    'do': []
  };
  this.workers.push(worker);
  var workerChainer = {
    "filter": function(filterCallback) {
      worker.filters.push(filterCallback);
      return workerChainer;
    },
    "do": function(doCallback) {
      worker.do.push(doCallback);
      return workerChainer;
    }
  };
  return workerChainer;
};

Accuser.prototype.run = function() {
  var self = this;
  var github = self.github;
  var prList = [];

  var runWorkers = function() {
    // the list is now done, run all workers
    self.workers.forEach(function(worker){
      prList.forEach(function(pr){
        var activateWorker = true;
        worker.filters.forEach(function(filter){
          activateWorker = activateWorker && filter(pr);
        });
        if (activateWorker) {
          worker.do.forEach(function(doCallback){
            doCallback(pr);
          });
        }
      });
    });
  };

  var tick = function() {
    this.repos.forEach(function(val) {
      var user = val[0];
      var repo = val[1];

      var processResponse = function(res) {
        prList = prList.concat(res);
        if (github.hasNextPage(res)) {
          github.getNextPage(res, processResponse);
        } else {
          runWorkers();
          setTimeout(tick, self.interval);
        }
      }
      self.github.pullRequests
        .getAll({
          'user': user,
          'repo': repo,
          'state': 'open'
        })
        .then(processResponse);
    });
  };

  setTimeout(tick, self.interval);
}

module.exports = Accuser;
