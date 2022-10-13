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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
            const issueNumber = context.issue.number;
            if (!(0, PullRequests_1.isPullRequest)(inputs.token)) {
                throw Error("This is not a pull request or pull request comment");
            }
            const { head_sha, body, comments } = yield (0, PullRequests_1.pullRequestDetails)(inputs.token);
            console.log({ comments });
            const incompletePullRequestTasks = getIncompleteCount(body);
            const incompleteCommentTasks = yield getIncompleteCountFromComments(octokit, inputs.repository, issueNumber);
            const nIncompleteTasks = incompletePullRequestTasks + incompleteCommentTasks;
            yield octokit.rest.repos.createCommitStatus({
                owner: context.issue.owner,
                repo: context.issue.repo,
                sha: head_sha,
                state: nIncompleteTasks === 0 ? "success" : "error",
                target_url: "https://github.com/chanzuckerberg/CZ-PR-bot/actions",
                description: nIncompleteTasks === 0
                    ? "Ready to merge"
                    : `Found ${nIncompleteTasks} unfinished task(s)`,
                context: "CZ PR Bot - todos",
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
function getIncompleteCountFromComments(octokit, repository, issueNumber) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let incompleteCount = 0;
        const [owner, repo] = repository.split("/");
        const parameters = {
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
        };
        try {
            for (var _b = __asyncValues(octokit.paginate.iterator(octokit.rest.issues.listComments, parameters)), _c; _c = yield _b.next(), !_c.done;) {
                const { data: comments } = _c.value;
                comments.forEach((comment) => {
                    incompleteCount = incompleteCount + getIncompleteCount(comment.body);
                });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return incompleteCount;
    });
}
run();
