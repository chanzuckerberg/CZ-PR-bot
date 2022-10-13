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
    const issueNumber = context.issue.number;

    if (!isPullRequest(inputs.token)) {
      throw Error("This is not a pull request or pull request comment");
    }
    const { head_sha, body, comments } = await pullRequestDetails(inputs.token);

    console.log({ comments });

    const incompletePullRequestTasks = getIncompleteCount(body);
    const incompleteCommentTasks = comments.nodes.reduce(
      (prevCount, currentNode) =>
        prevCount + getIncompleteCount(currentNode.body),
      0
    );

    const nIncompleteTasks =
      incompletePullRequestTasks + incompleteCommentTasks;

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
      context: "CZ PR Bot - todos",
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

async function getIncompleteCountFromComments(
  octokit: any,
  repository: string,
  issueNumber: number
): Promise<number> {
  let incompleteCount = 0;

  const [owner, repo] = repository.split("/");

  const parameters = {
    owner: owner,
    repo: repo,
    issue_number: issueNumber,
  };

  for await (const { data: comments } of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    parameters
  )) {
    comments.forEach((comment) => {
      incompleteCount = incompleteCount + getIncompleteCount(comment.body);
    });
  }
  return incompleteCount;
}

run();
