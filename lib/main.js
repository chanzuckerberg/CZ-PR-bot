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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const args = getAndValidateArgs();
            const octokit = github.getOctokit(args.repoToken);
            const context = github.context;
            const pull_request = context.payload.pull_request;
            // const pull_request_comments = pull_request.comments;
            if (!pull_request) {
                throw new Error("Payload is missing pull_request.");
            }
            core.info("github.context.payload.pull_request:");
            core.info(pull_request);
            // Replace argument to second call with comments instead of empty string
            const incompleteTaskListItem = getIncompleteCount(pull_request.body || "") + getIncompleteCount("");
            yield octokit.rest.repos.createCommitStatus({
                owner: context.issue.owner,
                repo: context.issue.repo,
                sha: pull_request.head.sha,
                state: incompleteTaskListItem === 0 ? "success" : "error",
                target_url: "https://github.com/chanzuckerberg/CZ-PR-bot",
                description: incompleteTaskListItem === 0 ? "Ready to merge" : `Found ${incompleteTaskListItem} unfinished task(s)`,
                context: "Actions TODO"
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function getAndValidateArgs() {
    return {
        repoToken: core.getInput('repo-token', { required: true }),
    };
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
