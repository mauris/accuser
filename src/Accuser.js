/*
  Accuser - Github wrapper for pull request automation.
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

Accuser.prototype.accuse = function(pr, usernames) {
  var self = this;
  self.github.issues.addAssigneesToIssue({
    user: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
    number: pr.number,
    assignees: usernames
  });
};

Accuser.prototype.comment = function(pr, comment) {
  var self = this;
  self.github.issues.createComment({
    user: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
    number: pr.number,
    body: comment
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

Accuser.prototype.tick = function() {
  var self = this;
  var promises = [];
  self.repos.forEach(function(repository) {
    var repoPromise = new Promise(function(resolve, reject){
      self.github.pullRequests
        .getAll({
          'user': repository.user,
          'repo': repository.repo,
          'state': 'open'
        })
        .then(createResponseCallback(self.github, resolve, repository));
    });
    promises.push(repoPromise);
  });

  return Promise
    .all(promises);
};

Accuser.prototype.run = function() {
  var self = this;
  var github = self.github;

  var tickInterval = function() {
    self.tick()
      .then(function() {
        setTimeout(tickInterval, self.interval);
      });
  };

  self.tick()
    .then(function() {
      setTimeout(tickInterval, self.interval);
    });
};

module.exports = Accuser;
