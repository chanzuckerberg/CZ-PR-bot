"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullRequestDetails = exports.isPullRequest = void 0;
const github_1 = require("@actions/github");
function isPullRequest(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, github_1.getOctokit)(token);
        const { data: { pull_request } } = yield client.rest.issues.get(Object.assign(Object.assign({}, github_1.context.repo), { issue_number: github_1.context.issue.number }));
        return !!pull_request;
    });
}
exports.isPullRequest = isPullRequest;
function pullRequestDetails(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, github_1.getOctokit)(token);
        const { repository: { pullRequest: { headRef, body, }, }, } = yield client.graphql(`
      query pullRequestDetails($repo:String!, $owner:String!, $number:Int!) {
        repository(name: $repo, owner: $owner) {
          pullRequest(number: $number) {
            headRef {
              name
              target {
                oid
              }
            }
            body
          }
        }
      }
    `, Object.assign(Object.assign({}, github_1.context.repo), { number: github_1.context.issue.number }));
        return {
            head_sha: headRef.target.oid,
            body,
        };
    });
}
exports.pullRequestDetails = pullRequestDetails;
