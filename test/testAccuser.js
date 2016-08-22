var assert = require('assert');
var sinon = require('sinon');
var Accuser = require('../');

describe("Accuser", function() {
  var accuser;

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
    var pr = {
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
    accuser.github = {
      issues: {
        addAssigneesToIssue: function(obj) {
          assert(obj.repo === pr.base.repo.name);
          assert(obj.user === pr.base.repo.owner.login);
          assert(obj.number === pr.number);
          assert(obj.assignees[0] === "mauris");
        }
      }
    };
    var mock = sinon.mock(accuser.github.issues);
    mock.expects("addAssigneesToIssue").once();
    accuser.accuse(pr, ["mauris"]);
    mock.verify();
    next();
  });

  it("should add a comment to a pull request", function(next) {
    var pr = {
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
    accuser.github = {
      issues: {
        createComment: function(obj) {
          assert(obj.repo === pr.base.repo.name);
          assert(obj.user === pr.base.repo.owner.login);
          assert(obj.number === pr.number);
          assert(obj.body === "some comment");
        }
      }
    };
    var mock = sinon.mock(accuser.github.issues);
    mock.expects("createComment").once();
    accuser.comment(pr, "some comment");
    mock.verify();
    next();
  });
});
