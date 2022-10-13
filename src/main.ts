import * as core from "@actions/core";
import * as github from "@actions/github";
import { isPullRequest, pullRequestDetails } from "./PullRequests";

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
    const inputs: Inputs = {
      octokit,
      token: core.getInput("repo-token"),
      repository: core.getInput("repository"),
      issueNumber: context.issue.number,
      commentAuthor: core.getInput("comment-author"),
      bodyIncludes: core.getInput("body-includes"),
      direction: core.getInput("direction"),
    };

    if (!isPullRequest(inputs.token)) {
      throw Error("This is not a pull request or pull request comment");
    }
    const {
      base_ref,
      base_sha,
      head_ref,
      head_sha,
    } = await pullRequestDetails(inputs.token);

    console.log({base_ref, base_sha, head_ref, head_sha})


    const incompleteCommentTasks = await getIncompleteCountFromComments(inputs);
    // const incompletePullRequestBodyItems = pull_request
    //   ? getIncompleteCount(pull_request.body || "")
    //   : 0;

    // const nIncompleteItems =
    //   incompletePullRequestBodyItems + incompleteCommentTasks

    const nIncompleteItems = 2;

    await octokit.rest.repos.createCommitStatus({
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
          description:`test description`,
      context: "CZ PR Bot - todos",
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

  console.log({parameters})

  const comments = await octokit.rest.issues.listComments(parameters)

  console.log({comments})
  // for await (const { data: comments } of octokit.paginate.iterator(
  //   octokit.rest.issues.listComments,
  //   parameters
  // )) {
  //   console.log({comments})
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
