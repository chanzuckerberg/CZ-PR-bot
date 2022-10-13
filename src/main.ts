import * as core from "@actions/core";
import * as github from "@actions/github";
import { isPullRequest, pullRequestDetails } from "./PullRequests";

type Args = {
  repoToken: string;
};

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
    const { head_sha, body } = await pullRequestDetails(
      inputs.token
    );

    const incompleteCommentTasks = await getIncompleteCountFromComments(octokit, inputs, issueNumber);
    const incompletePullRequestBodyItems = getIncompleteCount(body)

    const nIncompleteItems =
      incompletePullRequestBodyItems + incompleteCommentTasks;
    console.log({nIncompleteItems})

    await octokit.rest.repos.createCommitStatus({
      owner: context.issue.owner,
      repo: context.issue.repo,
      sha: head_sha,
      state: nIncompleteItems === 0 ? "success" : "error",
      target_url: "https://github.com/chanzuckerberg/CZ-PR-bot/actions",
      description:
        nIncompleteItems === 0
          ? "Ready to merge"
          : `Found ${nIncompleteItems} unfinished task(s)`,
      context: "CZ PR Bot - todos",
    });
  } catch (error) {
    core.setFailed((error as any).message);
  }
}

async function getIncompleteCountFromComments(octokit: any, inputs: Inputs, issueNumber: number): Promise<number> {
  let incompleteCount = 0;

  const [owner, repo] = inputs.repository.split("/");

  const parameters = {
    owner: owner,
    repo: repo,
    issue_number: issueNumber,
  };

  for await (const { data: comments } of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    parameters
  )) {
    console.log({ comments });
    // TODO: this is the same as the code for pull request body
    comments.forEach((comment) => {
      const commentLines = comment.body.match(/[^\r\n]+/g);
      if (commentLines === null) {
        return;
      }
      for (const line of commentLines) {
        if (line.trim().startsWith("- [ ]")) {
          incompleteCount++;
        }
      }
    });
  }
  return incompleteCount;
}

function getIncompleteCount(pullRequestBody: string) {
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
