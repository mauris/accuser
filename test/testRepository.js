var assert = require('assert');
var sinon = require('sinon');
var Repository = require('../src/Repository');

describe("Repository", function() {
  var repository;

  beforeEach(function() {
    repository = new Repository("mauris", "accuser");
  });

  it("should store the username and repository name", function(next){
    assert(repository.user === "mauris");
    assert(repository.repo === "accuser");
    next();
  });

  it("should create new worker using the newWorker() method", function(next){
    assert(repository.workers.length === 0);
    repository.newWorker();
    assert(repository.workers.length === 1);
    next();
  });

  it("should allow chaining filter() and do() methods for newWorker() method", function(next){
    var chainer = repository.newWorker();
    assert(repository.workers[0].filters.length === 0);
    assert(repository.workers[0].do.length === 0);
    assert(chainer === chainer.filter(function(){}));
    assert(chainer === chainer.do(function(){}));
    assert(repository.workers[0].filters.length === 1);
    assert(repository.workers[0].do.length === 1);
    next();
  });
});
