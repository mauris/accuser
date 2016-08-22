
var Repository = function (user, repo) {
  this.user = user;
  this.repo = repo;
  this.workers = [];
};

Repository.prototype.newWorker = function() {
  var self = this;
  var worker = {
    'filters': [],
    'do': []
  };
  self.workers.push(worker);
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

module.exports = Repository;
