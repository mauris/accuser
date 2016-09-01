/*
  Accuser - Github wrapper for issue and pull request automation.
  Written by Sam-Mauris Yong
  Code licensed under MIT License.
 */

var GitHubApi = require("github");
var Promise = require('bluebird');
var Repository = require("./Repository");

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

Accuser.prototype.accuse = function(repository, issue, usernames) {
  var self = this;
  self.github.issues.addAssigneesToIssue({
    user: repository.user,
    repo: repository.repo,
    number: issue.number,
    assignees: usernames.constructor == Array ? usernames : [usernames]
  });
};

Accuser.prototype.comment = function(repository, issue, comment) {
  var self = this;
  self.github.issues.createComment({
    user: repository.user,
    repo: repository.repo,
    number: issue.number,
    body: comment
  });
};

Accuser.prototype.addLabels = function(repository, issue, labels) {
  var self = this;
  self.github.issues.addLabels({
    user: repository.user,
    repo: repository.repo,
    number: issue.number,
    body: labels.constructor == Array ? labels : [labels]
  });
};

Accuser.prototype.removeLabel = function(repository, issue, label) {
  var self = this;
  self.github.issues.removeLabel({
    user: repository.user,
    repo: repository.repo,
    number: issue.number,
    name: label
  });
};

Accuser.prototype.open = function(repository, issue) {
  var self = this;
  self.github.issues.edit({
    user: repository.user,
    repo: repository.repo,
    number: issue.number,
    state: 'open'
  });
};

Accuser.prototype.close = function(repository, issue) {
  var self = this;
  self.github.issues.edit({
    user: repository.user,
    repo: repository.repo,
    number: issue.number,
    state: 'closed'
  });
};

Accuser.prototype.addRepository = function(user, repo) {
  var self = this;
  var repository = new Repository(user, repo);
  self.repos.push(repository);
  return repository;
};

var runWorkers = function(repository, prList) {
  // the list is now done, run all workers
  repository.workers.forEach(function(worker){
    prList.forEach(function(pr){
      var activateWorker = true;
      worker.filters.forEach(function(filter){
        activateWorker = activateWorker && filter(repository, pr);
      });
      if (activateWorker) {
        worker.do.forEach(function(doCallback){
          doCallback(repository, pr);
        });
      }
    });
  });
};

var createResponseCallback = function(github, resolve, repository) {
  return function(result) {
    runWorkers(repository, result);
    if (github.hasNextPage(result)) {
      github.getNextPage(result, function(err, res){
        var callback = createResponseCallback(github, resolve, repository);
        if (err === null) {
          callback(res);
        }
      });
    } else {
      // done with all paginations
      resolve();
    }
  };
};

Accuser.prototype.tick = function(filters) {
  var self = this;
  var promises = [];

  filters = filters || {};
  filters.state = filters.state || 'open';
  filters.assignee = filters.assignee || '*';

  self.repos.forEach(function(repository) {
    var repoPromise = new Promise(function(resolve, reject){
      filters.user = repository.user;
      filters.repo = repository.repo;
      self.github.issues
        .getForRepo(filters)
        .then(createResponseCallback(self.github, resolve, repository));
    });
    promises.push(repoPromise);
  });

  return Promise
    .all(promises);
};

Accuser.prototype.run = function(filters) {
  var self = this;
  var github = self.github;

  filters = filters || {};

  var tickInterval = function() {
    self.tick(filters)
      .then(function() {
        setTimeout(tickInterval, self.interval);
      });
  };

  self.tick(filters)
    .then(function() {
      setTimeout(tickInterval, self.interval);
    });
};

module.exports = Accuser;
