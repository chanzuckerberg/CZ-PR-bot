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
        try {
            const inputs = {
                token: core.getInput("repo-token"),
                repository: core.getInput("repository"),
            };
            const octokit = github.getOctokit(inputs.token);
            const context = github.context;
            if (!(0, PullRequests_1.isPullRequest)(inputs.token)) {
                throw Error("This is not a pull request or pull request comment");
            }
            const { head_sha, body, comments, reviewThreads } = yield (0, PullRequests_1.pullRequestDetails)(inputs.token);
            console.log({ reviewThreads });
            const incompletePullRequestTasks = getIncompleteCount(body);
            const incompleteCommentTasks = comments.nodes.reduce((prevCount, currentNode) => prevCount + getIncompleteCount(currentNode.body), 0);
            const incompleteReviewTasks = reviewThreads.nodes.reduce((reviewCount, currentThread) => {
                return reviewCount + currentThread.comments.nodes.reduce((threadCount, currentComment) => {
                    console.log({ currentComment });
                    return threadCount + getIncompleteCount(currentComment.body);
                }, 0);
            }, 0);
            const nIncompleteTasks = incompletePullRequestTasks + incompleteCommentTasks + incompleteReviewTasks;
            yield octokit.rest.repos.createCommitStatus({
                owner: context.issue.owner,
                repo: context.issue.repo,
                sha: head_sha,
                state: nIncompleteTasks === 0 ? "success" : "error",
                target_url: "https://github.com/chanzuckerberg/CZ-PR-bot/actions",
                description: nIncompleteTasks === 0
                    ? "Ready to merge"
                    : `Found ${nIncompleteTasks} unfinished task(s)`,
                context: "CZ PR TODO Bot",
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function getIncompleteCount(contentBody) {
    if (!contentBody) {
        return 0;
    }
    const contentBodyLines = contentBody.match(/[^\r\n]+/g);
    if (contentBodyLines === null) {
        return 0;
    }
    let incompleteCount = 0;
    for (const line of contentBodyLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("- [ ]") || trimmedLine.startsWith("[]")) {
            incompleteCount++;
        }
    }
    return incompleteCount;
}
run();
