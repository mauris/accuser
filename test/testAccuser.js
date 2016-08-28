var assert = require('assert');
var sinon = require('sinon');
var Promise = require('bluebird');
var Accuser = require('../');

describe("Accuser", function() {
  var accuser;

  var sampleIssue = {
    number: 20,
    base: {
      repo: {
        name: "accuser",
        owner: {
          login: "mauris"
        }
      }
    }
  };

  beforeEach(function() {
    accuser = new Accuser();
  });

  it("should authenticate with Github", function(next) {
    var repository = accuser.addRepository("mauris", "accuser");
    assert(repository);
    assert(accuser.repos[0] === repository);
    next();
  });

  it("should be able to add a new repository", function(next) {
    accuser.github = {
      authenticate: function(config){
        assert(config.type === "oauth");
        assert(config.token === "some token");
      }
    };
    var mock = sinon.mock(accuser.github);
    mock.expects("authenticate").once();
    accuser.authenticate({
      "type": "oauth",
      "token": "some token"
    });
    mock.verify();
    next();
  });

  it("should accuse someone based on a pull request object and username", function(next) {
    var repository = accuser.addRepository("mauris", "accuser");

    accuser.github = {
      issues: {
        addAssigneesToIssue: function(obj) {
          assert(obj.repo === repository.repo);
          assert(obj.user === repository.user);
          assert(obj.number === sampleIssue.number);
          assert(obj.assignees[0] === "mauris");
        }
      }
    };
    var mock = sinon.mock(accuser.github.issues);
    mock.expects("addAssigneesToIssue").once();
    accuser.accuse(repository, sampleIssue, ["mauris"]);
    mock.verify();
    next();
  });

  it("should add a comment to a pull request", function(next) {
    var repository = accuser.addRepository("mauris", "accuser");

    accuser.github = {
      issues: {
        createComment: function(obj) {
          assert(obj.repo === repository.repo);
          assert(obj.user === repository.user);
          assert(obj.number === sampleIssue.number);
          assert(obj.body === "some comment");
        }
      }
    };
    var mock = sinon.mock(accuser.github.issues);
    mock.expects("createComment").once();
    accuser.comment(repository, sampleIssue, "some comment");
    mock.verify();
    next();
  });

  it("should fetch pull requests from an added repository", function(next) {
    var repository = accuser.addRepository("mauris", "accuser");

    var filterSpy = sinon.spy();
    var workerFilter = function(repo, pr) {
      assert(repository === repo);
      assert(pr == sampleIssue);
      filterSpy();
      return true;
    };

    var doSpy = sinon.spy();
    var workerDo = function(repo, pr) {
      assert(repository === repo);
      assert(pr == sampleIssue);
      doSpy();
    };

    repository.newWorker()
      .filter(workerFilter)
      .do(workerDo);

    accuser.github = {
      issues: {
        getForRepo: function(obj) {
          return new Promise(function(resolve, reject){
            resolve([sampleIssue]);
          })
        }
      },
      hasNextPage: function() {
        return false
      }
    };
    var mock = sinon.mock(accuser.github.issues);
    mock.expects("getForRepo").once().returns(new Promise(function(resolve, reject){
      resolve([sampleIssue]);
    }));

    accuser.tick()
      .then(function(){
        assert(filterSpy.calledOnce);
        assert(doSpy.calledOnce);
        mock.verify();
        next();
      });
  });
});
