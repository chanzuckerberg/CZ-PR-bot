import * as core from "@actions/core";
import * as github from "@actions/github";
import { isPullRequest, pullRequestDetails } from "./PullRequests";

interface Inputs {
  token: string;
  repository: string;
}

async function run() {
  try {
    const inputs: Inputs = {
      token: core.getInput("repo-token"),
      repository: core.getInput("repository"),
    };

    const octokit = github.getOctokit(inputs.token);

    const context = github.context;

    if (!isPullRequest(inputs.token)) {
      throw Error("This is not a pull request or pull request comment");
    }
    const { head_sha, body, comments, reviewThreads } = await pullRequestDetails(inputs.token);

    // Commenting out pr body incomplete tasks. It's getting annoying for the czgenepi PR templates
    // because we have some tasks in our template that are "won't do". The point of the bot is to 
    // enable reviewers anyway. If pr author wants to leave themself some todos they can do it in 
    // a comment.
    // const incompletePullRequestTasks = getIncompleteCount(body);
    const incompletePullRequestTasks = 0;

    // Comments on the PR
    const incompleteCommentTasks = comments.nodes.reduce(
      (prevCount, currentNode) =>
        prevCount + getIncompleteCount(currentNode.body),
      0
    );

    // Review comments
    const incompleteReviewTasks = reviewThreads.nodes.reduce((reviewCount, currentThread) => {
      return reviewCount + currentThread.comments.nodes.reduce((threadCount, currentComment) => {
        return threadCount + getIncompleteCount(currentComment.body);
      }, 0)
    }, 0)

    const nIncompleteTasks =
      incompletePullRequestTasks + incompleteCommentTasks + incompleteReviewTasks;

    await octokit.rest.repos.createCommitStatus({
      owner: context.issue.owner,
      repo: context.issue.repo,
      sha: head_sha,
      state: nIncompleteTasks === 0 ? "success" : "error",
      target_url: "https://github.com/chanzuckerberg/CZ-PR-bot/actions",
      description:
        nIncompleteTasks === 0
          ? "Ready to merge"
          : `Found ${nIncompleteTasks} unfinished task(s)`,
      context: "CZ PR TODO Bot",
    });
  } catch (error) {
    core.setFailed((error as any).message);
  }
}

function getIncompleteCount(contentBody: string) {
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
