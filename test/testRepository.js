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
});
