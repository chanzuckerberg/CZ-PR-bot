import * as core from "@actions/core";
import * as github from "@actions/github";

type Args = {
  repoToken: string;
};

interface Inputs {
  octokit: any; // TODO: type me!!
  token: string;
  repository: string;
  issueNumber: number;
  commentAuthor: string;
  bodyIncludes: string;
  direction: string;
}

async function run() {
  try {
    const args = getAndValidateArgs();
    const octokit = github.getOctokit(args.repoToken);
    const context = github.context;
    const pull_request = context.payload.pull_request;

    if (!pull_request) {
      throw new Error("Payload is missing pull_request.");
    }

    // TODO: repetitive with oktokit above
    const inputs: Inputs = {
      octokit,
      token: core.getInput("token"),
      repository: core.getInput("repository"),
      issueNumber: Number(core.getInput("issue-number")),
      commentAuthor: core.getInput("comment-author"),
      bodyIncludes: core.getInput("body-includes"),
      direction: core.getInput("direction"),
    };

    console.log({ inputs });

    const incompleteCommentTasks = await getIncompleteCountFromComments(inputs);
    const incompleteTaskListItem =
      getIncompleteCount(pull_request.body || "") + incompleteCommentTasks;

    await octokit.rest.repos.createCommitStatus({
      owner: context.issue.owner,
      repo: context.issue.repo,
      sha: pull_request.head.sha,
      state: incompleteTaskListItem === 0 ? "success" : "error",
      target_url: "https://github.com/adriangodong/actions-todo-bot",
      description:
        incompleteTaskListItem === 0
          ? "Ready to merge"
          : `Found ${incompleteTaskListItem} unfinished task(s)`,
      context: "Actions TODO",
    });
  } catch (error) {
    core.setFailed((error as any).message);
  }
}

function getAndValidateArgs(): Args {
  return {
    repoToken: core.getInput("repo-token", { required: true }),
  };
}

async function getIncompleteCountFromComments(inputs: Inputs): Promise<number> {
  const { octokit } = inputs;
  let incompleteCount = 0;

  const [owner, repo] = inputs.repository.split("/");

  const parameters = {
    owner: owner,
    repo: repo,
    issue_number: inputs.issueNumber,
  };

  for await (const { data: comments } of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    parameters
  )) {
    // TODO: this is the same as the code for pull request body
    comments.forEach((comment) => {
      const commentLines = comment.match(/[^\r\n]+/g);
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
