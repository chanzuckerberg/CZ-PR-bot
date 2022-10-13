"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const PullRequests_1 = require("./PullRequests");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("----");
        console.log("running");
        console.log("----");
        try {
            const args = getAndValidateArgs();
            const octokit = github.getOctokit(args.repoToken);
            const context = github.context;
            const pull_request = context.payload.pull_request;
            const comment = context.payload.comment;
            // TODO: repetitive with oktokit above
            const inputs = {
                octokit,
                token: core.getInput("repo-token"),
                repository: core.getInput("repository"),
                issueNumber: Number(core.getInput("issue-number")),
                commentAuthor: core.getInput("comment-author"),
                bodyIncludes: core.getInput("body-includes"),
                direction: core.getInput("direction"),
            };
            if (!(0, PullRequests_1.isPullRequest)(inputs.token)) {
                throw Error("This is not a pull request or pull request comment");
            }
            const { base_ref, base_sha, head_ref, head_sha, } = yield (0, PullRequests_1.pullRequestDetails)(inputs.token);
            console.log({ base_ref, base_sha, head_ref, head_sha });
            const incompleteCommentTasks = yield getIncompleteCountFromComments(inputs);
            // const incompletePullRequestBodyItems = pull_request
            //   ? getIncompleteCount(pull_request.body || "")
            //   : 0;
            // const nIncompleteItems =
            //   incompletePullRequestBodyItems + incompleteCommentTasks
            const nIncompleteItems = 2;
            yield octokit.rest.repos.createCommitStatus({
                owner: context.issue.owner,
                repo: context.issue.repo,
                sha: head_sha,
                // state: nIncompleteItems === 0 ? "success" : "error",
                state: "error",
                target_url: "https://github.com/chanzuckerberg/CZ-PR-bot/actions",
                // description:
                //   nIncompleteItems === 0
                //     ? "Ready to merge"
                //     : `Found ${nIncompleteItems} unfinished task(s)`,
                description: `test description`,
                context: "CZ PR Bot - todos",
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function getAndValidateArgs() {
    return {
        repoToken: core.getInput("repo-token", { required: true }),
    };
}
function getIncompleteCountFromComments(inputs) {
    return __awaiter(this, void 0, void 0, function* () {
        const { octokit } = inputs;
        let incompleteCount = 0;
        const [owner, repo] = inputs.repository.split("/");
        const parameters = {
            owner: owner,
            repo: repo,
            issue_number: inputs.issueNumber,
        };
        // for await (const { data: comments } of octokit.paginate.iterator(
        //   octokit.rest.issues.listComments,
        //   parameters
        // )) {
        //   // TODO: this is the same as the code for pull request body
        //   comments.forEach((comment) => {
        //     const commentLines = comment.body.match(/[^\r\n]+/g);
        //     if (commentLines === null) {
        //       return;
        //     }
        //     for (const line of commentLines) {
        //       if (line.trim().startsWith("- [ ]")) {
        //         incompleteCount++;
        //       }
        //     }
        //   });
        // }
        return incompleteCount;
    });
}
function getIncompleteCount(pullRequestBody) {
    if (!pullRequestBody) {
        return 0;
    }
    const pullRequestBodyLines = pullRequestBody.match(/[^\r\n]+/g);
    if (pullRequestBodyLines === null) {
        return 0;
    }
    let incompleteCount = 0;
    for (const line of pullRequestBodyLines) {
        if (line.trim().startsWith("- [ ]")) {
            incompleteCount++;
        }
    }
    return incompleteCount;
}
run();
